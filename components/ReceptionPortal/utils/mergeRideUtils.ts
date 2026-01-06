import { RideRequest, BuggyStatus, RouteSegment } from "../../../types";

/**
 * Check if two rides can be combined
 * @returns true if rides can be merged (total guests <= 7 and both are SEARCHING)
 */
export const canCombineRides = (ride1: RideRequest, ride2: RideRequest): boolean => {
    const totalGuests = (ride1.guestCount || 1) + (ride2.guestCount || 1);
    return (
        totalGuests <= 7 &&
        ride1.status === BuggyStatus.SEARCHING &&
        ride2.status === BuggyStatus.SEARCHING
    );
};

/**
 * Calculate optimal merge route for two rides
 * Uses traveling salesman algorithm to find shortest route
 */
export const calculateOptimalMergeRoute = (
    ride1: RideRequest,
    ride2: RideRequest,
    resolveLocationCoordinates: (locationName: string) => { lat: number; lng: number } | null,
    calculateDistance: (coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }) => number
): {
    pickup: string;
    destination: string;
    routePath: string[];
    segments: RouteSegment[];
    isChainTrip: boolean;
} => {
    // Helper function to resolve coordinates for a location
    const getLocationCoords = (locationName: string) => {
        const coords = resolveLocationCoordinates(locationName);
        return coords
            ? { lat: coords.lat, lng: coords.lng }
            : { lat: undefined, lng: undefined };
    };

    // Same route - keep as is
    if (
        ride1.pickup === ride2.pickup &&
        ride1.destination === ride2.destination
    ) {
        const pickupCoords = getLocationCoords(ride1.pickup);
        const destCoords = getLocationCoords(ride1.destination);
        return {
            pickup: ride1.pickup,
            destination: ride1.destination,
            routePath: [ride1.pickup, ride1.destination],
            segments: [
                {
                    from: ride1.pickup,
                    to: ride1.destination,
                    fromLat: pickupCoords.lat,
                    fromLng: pickupCoords.lng,
                    toLat: destCoords.lat,
                    toLng: destCoords.lng,
                    onBoard: [
                        {
                            name: ride1.guestName || "Guest",
                            roomNumber: ride1.roomNumber,
                            count: ride1.guestCount || 1,
                        },
                        {
                            name: ride2.guestName || "Guest",
                            roomNumber: ride2.roomNumber,
                            count: ride2.guestCount || 1,
                        },
                    ],
                },
            ],
            isChainTrip: false,
        };
    }

    // Chain trip possibilities can be simplified by the generic algorithm below
    // But we can keep these simple checks for performance
    if (ride1.destination === ride2.pickup) {
        // ... (existing chain trip logic can be refactored, but let's keep it for now)
    }

    // Generic route optimization
    const pickup1Coords = getLocationCoords(ride1.pickup);
    const dest1Coords = getLocationCoords(ride1.destination);
    const pickup2Coords = getLocationCoords(ride2.pickup);
    const dest2Coords = getLocationCoords(ride2.destination);

    // If we don't have coordinates for all points, fallback to simple logic
    if (
        !pickup1Coords?.lat ||
        !dest1Coords?.lat ||
        !pickup2Coords?.lat ||
        !dest2Coords?.lat
    ) {
        // Fallback to time-based simple chain
        const baseRide = ride1.timestamp <= ride2.timestamp ? ride1 : ride2;
        const otherRide = ride1.timestamp <= ride2.timestamp ? ride2 : ride1;
        return {
            pickup: baseRide.pickup,
            destination: otherRide.destination,
            routePath: [
                baseRide.pickup,
                baseRide.destination,
                otherRide.pickup,
                otherRide.destination,
            ],
            segments: [
                {
                    from: baseRide.pickup,
                    to: baseRide.destination,
                    onBoard: [
                        {
                            name: baseRide.guestName,
                            roomNumber: baseRide.roomNumber,
                            count: baseRide.guestCount || 1,
                        },
                    ],
                },
                {
                    from: otherRide.pickup,
                    to: otherRide.destination,
                    onBoard: [
                        {
                            name: otherRide.guestName,
                            roomNumber: otherRide.roomNumber,
                            count: otherRide.guestCount || 1,
                        },
                    ],
                },
            ],
            isChainTrip: false,
        };
    }

    // Calculate distances
    const getDistance = (from: string, to: string): number => {
        const fromCoords = getLocationCoords(from);
        const toCoords = getLocationCoords(to);
        if (!fromCoords?.lat || !toCoords?.lat) return Infinity;
        return calculateDistance(
            { lat: fromCoords.lat, lng: fromCoords.lng },
            { lat: toCoords.lat, lng: toCoords.lng },
        );
    };

    const allPoints = Array.from(
        new Set([
            ride1.pickup,
            ride1.destination,
            ride2.pickup,
            ride2.destination,
        ]),
    );

    // This is a traveling salesman problem, which is NP-hard.
    // For 4-5 points, a brute-force permutation approach is acceptable.
    const permutations = (arr: string[]): string[][] => {
        if (arr.length === 0) return [[]];
        const first = arr[0];
        const rest = arr.slice(1);
        const permsWithoutFirst = permutations(rest);
        const allPermutations: string[][] = [];
        permsWithoutFirst.forEach((perm) => {
            for (let i = 0; i <= perm.length; i++) {
                const permWithFirst = [...perm.slice(0, i), first, ...perm.slice(i)];
                allPermutations.push(permWithFirst);
            }
        });
        return allPermutations;
    };

    const possibleRoutes = permutations(allPoints);

    let bestRoute: string[] = [];
    let minDistance = Infinity;

    possibleRoutes.forEach((route) => {
        // A valid route must respect pickup->destination order for both rides
        if (
            route.indexOf(ride1.pickup) > route.indexOf(ride1.destination) ||
            route.indexOf(ride2.pickup) > route.indexOf(ride2.destination)
        ) {
            return;
        }

        let currentDistance = 0;
        for (let i = 0; i < route.length - 1; i++) {
            currentDistance += getDistance(route[i], route[i + 1]);
        }

        if (currentDistance < minDistance) {
            minDistance = currentDistance;
            bestRoute = route;
        }
    });

    const segments: RouteSegment[] = [];
    if (bestRoute.length > 1) {
        let guest1OnBoard = false;
        let guest2OnBoard = false;
        for (let i = 0; i < bestRoute.length - 1; i++) {
            const from = bestRoute[i];
            const to = bestRoute[i + 1];

            if (from === ride1.pickup) guest1OnBoard = true;
            if (from === ride2.pickup) guest2OnBoard = true;

            const onBoard: RouteSegment["onBoard"] = [];
            if (guest1OnBoard)
                onBoard.push({
                    name: ride1.guestName,
                    roomNumber: ride1.roomNumber,
                    count: ride1.guestCount || 1,
                });
            if (guest2OnBoard)
                onBoard.push({
                    name: ride2.guestName,
                    roomNumber: ride2.roomNumber,
                    count: ride2.guestCount || 1,
                });

            segments.push({ from, to, onBoard });

            if (to === ride1.destination) guest1OnBoard = false;
            if (to === ride2.destination) guest2OnBoard = false;
        }
    }

    return {
        pickup: bestRoute[0] || ride1.pickup,
        destination: bestRoute[bestRoute.length - 1] || ride1.destination,
        routePath: bestRoute,
        segments,
        isChainTrip:
            ride1.destination === ride2.pickup ||
            ride2.destination === ride1.pickup,
    };
};

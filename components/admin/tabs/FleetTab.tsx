import React from 'react';
import ReceptionPortal from '../../ReceptionPortal';
import { User } from '../../../types';

interface FleetTabProps {
    user: User;
    onLogout: () => void;
}

export const FleetTab: React.FC<FleetTabProps> = ({ user, onLogout }) => {
    return (
        <ReceptionPortal
            user={user}
            onLogout={onLogout}
            embedded={true}
        />
    );
};

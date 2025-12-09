--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

-- Started on 2025-12-09 09:39:38

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 879 (class 1247 OID 105600)
-- Name: buggy_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.buggy_status AS ENUM (
    'IDLE',
    'SEARCHING',
    'ASSIGNED',
    'ARRIVING',
    'ON_TRIP',
    'COMPLETED'
);


ALTER TYPE public.buggy_status OWNER TO postgres;

--
-- TOC entry 888 (class 1247 OID 105630)
-- Name: location_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.location_type AS ENUM (
    'VILLA',
    'FACILITY',
    'RESTAURANT'
);


ALTER TYPE public.location_type OWNER TO postgres;

--
-- TOC entry 891 (class 1247 OID 105638)
-- Name: message_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.message_role AS ENUM (
    'user',
    'model'
);


ALTER TYPE public.message_role OWNER TO postgres;

--
-- TOC entry 885 (class 1247 OID 105622)
-- Name: service_request_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.service_request_status AS ENUM (
    'PENDING',
    'CONFIRMED',
    'COMPLETED'
);


ALTER TYPE public.service_request_status OWNER TO postgres;

--
-- TOC entry 882 (class 1247 OID 105614)
-- Name: service_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.service_type AS ENUM (
    'DINING',
    'SPA',
    'HOUSEKEEPING',
    'POOL',
    'BUTLER'
);


ALTER TYPE public.service_type OWNER TO postgres;

--
-- TOC entry 876 (class 1247 OID 105590)
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'GUEST',
    'ADMIN',
    'DRIVER',
    'STAFF',
    'SUPERVISOR'
);


ALTER TYPE public.user_role OWNER TO postgres;

--
-- TOC entry 247 (class 1255 OID 105184)
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 230 (class 1259 OID 105709)
-- Name: ride_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ride_requests (
    id integer NOT NULL,
    guest_name character varying(100) NOT NULL,
    room_number character varying(20) NOT NULL,
    pickup character varying(255) NOT NULL,
    destination character varying(255) NOT NULL,
    status public.buggy_status DEFAULT 'SEARCHING'::public.buggy_status NOT NULL,
    "timestamp" bigint NOT NULL,
    driver_id integer,
    eta integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    rating integer,
    feedback text,
    pick_timestamp timestamp without time zone,
    drop_timestamp timestamp without time zone,
    assigned_timestamp timestamp without time zone,
    CONSTRAINT ride_requests_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.ride_requests OWNER TO postgres;

--
-- TOC entry 5018 (class 0 OID 0)
-- Dependencies: 230
-- Name: COLUMN ride_requests.rating; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ride_requests.rating IS 'Guest rating for the ride (1-5 stars)';


--
-- TOC entry 5019 (class 0 OID 0)
-- Dependencies: 230
-- Name: COLUMN ride_requests.feedback; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ride_requests.feedback IS 'Guest feedback/comment for the ride';


--
-- TOC entry 5020 (class 0 OID 0)
-- Dependencies: 230
-- Name: COLUMN ride_requests.pick_timestamp; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ride_requests.pick_timestamp IS 'Timestamp when driver picked up the guest (status = ON_TRIP)';


--
-- TOC entry 5021 (class 0 OID 0)
-- Dependencies: 230
-- Name: COLUMN ride_requests.drop_timestamp; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ride_requests.drop_timestamp IS 'Timestamp when ride was completed (status = COMPLETED)';


--
-- TOC entry 5022 (class 0 OID 0)
-- Dependencies: 230
-- Name: COLUMN ride_requests.assigned_timestamp; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ride_requests.assigned_timestamp IS 'Timestamp when driver accepted the ride (status = ASSIGNED/ARRIVING)';


--
-- TOC entry 218 (class 1259 OID 105644)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    last_name character varying(100) NOT NULL,
    room_number character varying(20) NOT NULL,
    villa_type character varying(100),
    role public.user_role DEFAULT 'GUEST'::public.user_role NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    password character varying(255),
    language character varying(50) DEFAULT 'English'::character varying,
    notes text
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 5023 (class 0 OID 0)
-- Dependencies: 218
-- Name: COLUMN users.password; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.password IS 'Password for staff/admin/driver/supervisor accounts. NULL for guest accounts.';


--
-- TOC entry 5024 (class 0 OID 0)
-- Dependencies: 218
-- Name: COLUMN users.language; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.language IS 'Preferred language for the user (English, Vietnamese, Korean, Japanese, Chinese, French, Russian)';


--
-- TOC entry 5025 (class 0 OID 0)
-- Dependencies: 218
-- Name: COLUMN users.notes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.notes IS 'Guest personal notes and preferences';


--
-- TOC entry 235 (class 1259 OID 105772)
-- Name: active_rides; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.active_rides AS
 SELECT r.id,
    r.guest_name,
    r.room_number,
    r.pickup,
    r.destination,
    r.status,
    r."timestamp",
    r.driver_id,
    r.eta,
    r.created_at,
    r.updated_at,
    u.last_name AS driver_last_name
   FROM (public.ride_requests r
     LEFT JOIN public.users u ON ((r.driver_id = u.id)))
  WHERE (r.status <> 'COMPLETED'::public.buggy_status)
  ORDER BY r."timestamp" DESC;


ALTER VIEW public.active_rides OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 105738)
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_messages (
    id integer NOT NULL,
    role public.message_role NOT NULL,
    text text NOT NULL,
    user_id integer,
    room_number character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    service_type character varying(50)
);


ALTER TABLE public.chat_messages OWNER TO postgres;

--
-- TOC entry 5026 (class 0 OID 0)
-- Dependencies: 234
-- Name: COLUMN chat_messages.service_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.chat_messages.service_type IS 'Service type for the chat: DINING, SPA, POOL, BUTLER, BUGGY, or GENERAL';


--
-- TOC entry 233 (class 1259 OID 105737)
-- Name: chat_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.chat_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chat_messages_id_seq OWNER TO postgres;

--
-- TOC entry 5027 (class 0 OID 0)
-- Dependencies: 233
-- Name: chat_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.chat_messages_id_seq OWNED BY public.chat_messages.id;


--
-- TOC entry 244 (class 1259 OID 106854)
-- Name: hotel_reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hotel_reviews (
    id integer NOT NULL,
    room_number character varying(20) NOT NULL,
    guest_name character varying(100) NOT NULL,
    category_ratings jsonb NOT NULL,
    average_rating numeric(3,1) NOT NULL,
    comment text,
    "timestamp" bigint NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.hotel_reviews OWNER TO postgres;

--
-- TOC entry 5028 (class 0 OID 0)
-- Dependencies: 244
-- Name: TABLE hotel_reviews; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.hotel_reviews IS 'Hotel reviews submitted by guests';


--
-- TOC entry 5029 (class 0 OID 0)
-- Dependencies: 244
-- Name: COLUMN hotel_reviews.category_ratings; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.hotel_reviews.category_ratings IS 'JSON array of category ratings: [{"category": "Reception & Front Desk", "rating": 5}, ...]';


--
-- TOC entry 5030 (class 0 OID 0)
-- Dependencies: 244
-- Name: COLUMN hotel_reviews.average_rating; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.hotel_reviews.average_rating IS 'Calculated average of all category ratings';


--
-- TOC entry 243 (class 1259 OID 106853)
-- Name: hotel_reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hotel_reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hotel_reviews_id_seq OWNER TO postgres;

--
-- TOC entry 5031 (class 0 OID 0)
-- Dependencies: 243
-- Name: hotel_reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hotel_reviews_id_seq OWNED BY public.hotel_reviews.id;


--
-- TOC entry 226 (class 1259 OID 105687)
-- Name: knowledge_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.knowledge_items (
    id integer NOT NULL,
    question character varying(500) NOT NULL,
    answer text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.knowledge_items OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 105686)
-- Name: knowledge_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.knowledge_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.knowledge_items_id_seq OWNER TO postgres;

--
-- TOC entry 5032 (class 0 OID 0)
-- Dependencies: 225
-- Name: knowledge_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.knowledge_items_id_seq OWNED BY public.knowledge_items.id;


--
-- TOC entry 220 (class 1259 OID 105656)
-- Name: locations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.locations (
    id integer NOT NULL,
    lat numeric(10,8) NOT NULL,
    lng numeric(11,8) NOT NULL,
    name character varying(255) NOT NULL,
    type public.location_type,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.locations OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 105655)
-- Name: locations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.locations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.locations_id_seq OWNER TO postgres;

--
-- TOC entry 5033 (class 0 OID 0)
-- Dependencies: 219
-- Name: locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.locations_id_seq OWNED BY public.locations.id;


--
-- TOC entry 222 (class 1259 OID 105665)
-- Name: menu_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.menu_items (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    price numeric(10,2) NOT NULL,
    category character varying(50) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    language character varying(50) DEFAULT 'English'::character varying
);


ALTER TABLE public.menu_items OWNER TO postgres;

--
-- TOC entry 5034 (class 0 OID 0)
-- Dependencies: 222
-- Name: COLUMN menu_items.language; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.menu_items.language IS 'Language for the menu item (English, Vietnamese, Korean, Japanese, Chinese, French, Russian)';


--
-- TOC entry 221 (class 1259 OID 105664)
-- Name: menu_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.menu_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.menu_items_id_seq OWNER TO postgres;

--
-- TOC entry 5035 (class 0 OID 0)
-- Dependencies: 221
-- Name: menu_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.menu_items_id_seq OWNED BY public.menu_items.id;


--
-- TOC entry 242 (class 1259 OID 105833)
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    recipient_id character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    type character varying(20) NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT notifications_type_check CHECK (((type)::text = ANY ((ARRAY['INFO'::character varying, 'SUCCESS'::character varying, 'WARNING'::character varying])::text[])))
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- TOC entry 5036 (class 0 OID 0)
-- Dependencies: 242
-- Name: TABLE notifications; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.notifications IS 'System notifications for guests and staff';


--
-- TOC entry 5037 (class 0 OID 0)
-- Dependencies: 242
-- Name: COLUMN notifications.recipient_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.notifications.recipient_id IS 'Room number for guests, user ID for staff';


--
-- TOC entry 5038 (class 0 OID 0)
-- Dependencies: 242
-- Name: COLUMN notifications.type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.notifications.type IS 'Notification type: INFO, SUCCESS, or WARNING';


--
-- TOC entry 241 (class 1259 OID 105832)
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- TOC entry 5039 (class 0 OID 0)
-- Dependencies: 241
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- TOC entry 232 (class 1259 OID 105726)
-- Name: service_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service_requests (
    id integer NOT NULL,
    type public.service_type NOT NULL,
    status public.service_request_status DEFAULT 'PENDING'::public.service_request_status NOT NULL,
    details text NOT NULL,
    room_number character varying(20) NOT NULL,
    "timestamp" bigint NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    rating integer,
    feedback text,
    CONSTRAINT service_requests_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.service_requests OWNER TO postgres;

--
-- TOC entry 5040 (class 0 OID 0)
-- Dependencies: 232
-- Name: COLUMN service_requests.rating; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.service_requests.rating IS 'Guest rating for the service (1-5 stars)';


--
-- TOC entry 5041 (class 0 OID 0)
-- Dependencies: 232
-- Name: COLUMN service_requests.feedback; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.service_requests.feedback IS 'Guest feedback/comment for the service';


--
-- TOC entry 236 (class 1259 OID 105777)
-- Name: pending_services; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.pending_services AS
 SELECT s.id,
    s.type,
    s.status,
    s.details,
    s.room_number,
    s."timestamp",
    s.created_at,
    s.updated_at,
    u.last_name AS guest_last_name,
    u.villa_type
   FROM (public.service_requests s
     LEFT JOIN public.users u ON (((s.room_number)::text = (u.room_number)::text)))
  WHERE (s.status = 'PENDING'::public.service_request_status)
  ORDER BY s."timestamp" DESC;


ALTER VIEW public.pending_services OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 105676)
-- Name: promotions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.promotions (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    discount character varying(50),
    valid_until character varying(100),
    image_color character varying(50),
    image_url text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    language character varying(50) DEFAULT 'English'::character varying
);


ALTER TABLE public.promotions OWNER TO postgres;

--
-- TOC entry 5042 (class 0 OID 0)
-- Dependencies: 224
-- Name: COLUMN promotions.language; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.promotions.language IS 'Language for the promotion (English, Vietnamese, Korean, Japanese, Chinese, French, Russian)';


--
-- TOC entry 223 (class 1259 OID 105675)
-- Name: promotions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.promotions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.promotions_id_seq OWNER TO postgres;

--
-- TOC entry 5043 (class 0 OID 0)
-- Dependencies: 223
-- Name: promotions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.promotions_id_seq OWNED BY public.promotions.id;


--
-- TOC entry 228 (class 1259 OID 105698)
-- Name: resort_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.resort_events (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    date date NOT NULL,
    "time" time without time zone NOT NULL,
    location character varying(255) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    language character varying(50) DEFAULT 'English'::character varying
);


ALTER TABLE public.resort_events OWNER TO postgres;

--
-- TOC entry 5044 (class 0 OID 0)
-- Dependencies: 228
-- Name: COLUMN resort_events.language; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.resort_events.language IS 'Language for the resort event (English, Vietnamese, Korean, Japanese, Chinese, French, Russian)';


--
-- TOC entry 227 (class 1259 OID 105697)
-- Name: resort_events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.resort_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.resort_events_id_seq OWNER TO postgres;

--
-- TOC entry 5045 (class 0 OID 0)
-- Dependencies: 227
-- Name: resort_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.resort_events_id_seq OWNED BY public.resort_events.id;


--
-- TOC entry 229 (class 1259 OID 105708)
-- Name: ride_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ride_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ride_requests_id_seq OWNER TO postgres;

--
-- TOC entry 5046 (class 0 OID 0)
-- Dependencies: 229
-- Name: ride_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ride_requests_id_seq OWNED BY public.ride_requests.id;


--
-- TOC entry 238 (class 1259 OID 105788)
-- Name: room_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.room_types (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    location_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.room_types OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 105787)
-- Name: room_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.room_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.room_types_id_seq OWNER TO postgres;

--
-- TOC entry 5047 (class 0 OID 0)
-- Dependencies: 237
-- Name: room_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.room_types_id_seq OWNED BY public.room_types.id;


--
-- TOC entry 240 (class 1259 OID 105806)
-- Name: rooms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rooms (
    id integer NOT NULL,
    number character varying(20) NOT NULL,
    type_id integer NOT NULL,
    status character varying(20) DEFAULT 'Available'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT rooms_status_check CHECK (((status)::text = ANY ((ARRAY['Available'::character varying, 'Occupied'::character varying, 'Maintenance'::character varying])::text[])))
);


ALTER TABLE public.rooms OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 105805)
-- Name: rooms_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rooms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rooms_id_seq OWNER TO postgres;

--
-- TOC entry 5048 (class 0 OID 0)
-- Dependencies: 239
-- Name: rooms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rooms_id_seq OWNED BY public.rooms.id;


--
-- TOC entry 231 (class 1259 OID 105725)
-- Name: service_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.service_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.service_requests_id_seq OWNER TO postgres;

--
-- TOC entry 5049 (class 0 OID 0)
-- Dependencies: 231
-- Name: service_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.service_requests_id_seq OWNED BY public.service_requests.id;


--
-- TOC entry 246 (class 1259 OID 107010)
-- Name: user_read_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_read_messages (
    id integer NOT NULL,
    identifier character varying(100) NOT NULL,
    service_type character varying(50) NOT NULL,
    last_read_message_id integer NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_read_messages OWNER TO postgres;

--
-- TOC entry 5050 (class 0 OID 0)
-- Dependencies: 246
-- Name: TABLE user_read_messages; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.user_read_messages IS 'Tracks the last read message ID for each user (guest or staff) in each service chat';


--
-- TOC entry 245 (class 1259 OID 107009)
-- Name: user_read_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_read_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_read_messages_id_seq OWNER TO postgres;

--
-- TOC entry 5051 (class 0 OID 0)
-- Dependencies: 245
-- Name: user_read_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_read_messages_id_seq OWNED BY public.user_read_messages.id;


--
-- TOC entry 217 (class 1259 OID 105643)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 5052 (class 0 OID 0)
-- Dependencies: 217
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4764 (class 2604 OID 105741)
-- Name: chat_messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages ALTER COLUMN id SET DEFAULT nextval('public.chat_messages_id_seq'::regclass);


--
-- TOC entry 4777 (class 2604 OID 106857)
-- Name: hotel_reviews id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotel_reviews ALTER COLUMN id SET DEFAULT nextval('public.hotel_reviews_id_seq'::regclass);


--
-- TOC entry 4749 (class 2604 OID 105690)
-- Name: knowledge_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_items ALTER COLUMN id SET DEFAULT nextval('public.knowledge_items_id_seq'::regclass);


--
-- TOC entry 4738 (class 2604 OID 105659)
-- Name: locations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.locations ALTER COLUMN id SET DEFAULT nextval('public.locations_id_seq'::regclass);


--
-- TOC entry 4741 (class 2604 OID 105668)
-- Name: menu_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_items ALTER COLUMN id SET DEFAULT nextval('public.menu_items_id_seq'::regclass);


--
-- TOC entry 4773 (class 2604 OID 105836)
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- TOC entry 4745 (class 2604 OID 105679)
-- Name: promotions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotions ALTER COLUMN id SET DEFAULT nextval('public.promotions_id_seq'::regclass);


--
-- TOC entry 4752 (class 2604 OID 105701)
-- Name: resort_events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resort_events ALTER COLUMN id SET DEFAULT nextval('public.resort_events_id_seq'::regclass);


--
-- TOC entry 4756 (class 2604 OID 105712)
-- Name: ride_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ride_requests ALTER COLUMN id SET DEFAULT nextval('public.ride_requests_id_seq'::regclass);


--
-- TOC entry 4766 (class 2604 OID 105791)
-- Name: room_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_types ALTER COLUMN id SET DEFAULT nextval('public.room_types_id_seq'::regclass);


--
-- TOC entry 4769 (class 2604 OID 105809)
-- Name: rooms id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rooms ALTER COLUMN id SET DEFAULT nextval('public.rooms_id_seq'::regclass);


--
-- TOC entry 4760 (class 2604 OID 105729)
-- Name: service_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_requests ALTER COLUMN id SET DEFAULT nextval('public.service_requests_id_seq'::regclass);


--
-- TOC entry 4780 (class 2604 OID 107013)
-- Name: user_read_messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_read_messages ALTER COLUMN id SET DEFAULT nextval('public.user_read_messages_id_seq'::regclass);


--
-- TOC entry 4733 (class 2604 OID 105647)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 4818 (class 2606 OID 105746)
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- TOC entry 4841 (class 2606 OID 106863)
-- Name: hotel_reviews hotel_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotel_reviews
    ADD CONSTRAINT hotel_reviews_pkey PRIMARY KEY (id);


--
-- TOC entry 4843 (class 2606 OID 106865)
-- Name: hotel_reviews hotel_reviews_room_number_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotel_reviews
    ADD CONSTRAINT hotel_reviews_room_number_unique UNIQUE (room_number);


--
-- TOC entry 4803 (class 2606 OID 105696)
-- Name: knowledge_items knowledge_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_items
    ADD CONSTRAINT knowledge_items_pkey PRIMARY KEY (id);


--
-- TOC entry 4794 (class 2606 OID 105663)
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- TOC entry 4798 (class 2606 OID 105674)
-- Name: menu_items menu_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_pkey PRIMARY KEY (id);


--
-- TOC entry 4839 (class 2606 OID 105844)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 4801 (class 2606 OID 105685)
-- Name: promotions promotions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_pkey PRIMARY KEY (id);


--
-- TOC entry 4806 (class 2606 OID 105707)
-- Name: resort_events resort_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resort_events
    ADD CONSTRAINT resort_events_pkey PRIMARY KEY (id);


--
-- TOC entry 4811 (class 2606 OID 105719)
-- Name: ride_requests ride_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ride_requests
    ADD CONSTRAINT ride_requests_pkey PRIMARY KEY (id);


--
-- TOC entry 4825 (class 2606 OID 105799)
-- Name: room_types room_types_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_types
    ADD CONSTRAINT room_types_name_key UNIQUE (name);


--
-- TOC entry 4827 (class 2606 OID 105797)
-- Name: room_types room_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_types
    ADD CONSTRAINT room_types_pkey PRIMARY KEY (id);


--
-- TOC entry 4832 (class 2606 OID 105817)
-- Name: rooms rooms_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_number_key UNIQUE (number);


--
-- TOC entry 4834 (class 2606 OID 105815)
-- Name: rooms rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_pkey PRIMARY KEY (id);


--
-- TOC entry 4816 (class 2606 OID 105736)
-- Name: service_requests service_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_requests
    ADD CONSTRAINT service_requests_pkey PRIMARY KEY (id);


--
-- TOC entry 4848 (class 2606 OID 107018)
-- Name: user_read_messages user_read_messages_identifier_service_type_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_read_messages
    ADD CONSTRAINT user_read_messages_identifier_service_type_key UNIQUE (identifier, service_type);


--
-- TOC entry 4850 (class 2606 OID 107016)
-- Name: user_read_messages user_read_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_read_messages
    ADD CONSTRAINT user_read_messages_pkey PRIMARY KEY (id);


--
-- TOC entry 4789 (class 2606 OID 105652)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4791 (class 2606 OID 105654)
-- Name: users users_room_number_last_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_room_number_last_name_key UNIQUE (room_number, last_name);


--
-- TOC entry 4819 (class 1259 OID 105763)
-- Name: idx_chat_messages_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chat_messages_created_at ON public.chat_messages USING btree (created_at);


--
-- TOC entry 4820 (class 1259 OID 105849)
-- Name: idx_chat_messages_room_service; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chat_messages_room_service ON public.chat_messages USING btree (room_number, service_type);


--
-- TOC entry 4821 (class 1259 OID 105848)
-- Name: idx_chat_messages_service_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chat_messages_service_type ON public.chat_messages USING btree (service_type);


--
-- TOC entry 4822 (class 1259 OID 105762)
-- Name: idx_chat_messages_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chat_messages_user_id ON public.chat_messages USING btree (user_id);


--
-- TOC entry 4844 (class 1259 OID 106867)
-- Name: idx_hotel_reviews_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hotel_reviews_created_at ON public.hotel_reviews USING btree (created_at DESC);


--
-- TOC entry 4845 (class 1259 OID 106866)
-- Name: idx_hotel_reviews_room_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hotel_reviews_room_number ON public.hotel_reviews USING btree (room_number);


--
-- TOC entry 4792 (class 1259 OID 105754)
-- Name: idx_locations_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_locations_name ON public.locations USING btree (name);


--
-- TOC entry 4795 (class 1259 OID 105755)
-- Name: idx_menu_items_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_menu_items_category ON public.menu_items USING btree (category);


--
-- TOC entry 4796 (class 1259 OID 106850)
-- Name: idx_menu_items_language; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_menu_items_language ON public.menu_items USING btree (language);


--
-- TOC entry 4835 (class 1259 OID 105847)
-- Name: idx_notifications_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at DESC);


--
-- TOC entry 4836 (class 1259 OID 105846)
-- Name: idx_notifications_is_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (is_read);


--
-- TOC entry 4837 (class 1259 OID 105845)
-- Name: idx_notifications_recipient_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_recipient_id ON public.notifications USING btree (recipient_id);


--
-- TOC entry 4799 (class 1259 OID 106851)
-- Name: idx_promotions_language; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_promotions_language ON public.promotions USING btree (language);


--
-- TOC entry 4804 (class 1259 OID 106852)
-- Name: idx_resort_events_language; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_resort_events_language ON public.resort_events USING btree (language);


--
-- TOC entry 4807 (class 1259 OID 105758)
-- Name: idx_ride_requests_driver_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ride_requests_driver_id ON public.ride_requests USING btree (driver_id);


--
-- TOC entry 4808 (class 1259 OID 105756)
-- Name: idx_ride_requests_room_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ride_requests_room_number ON public.ride_requests USING btree (room_number);


--
-- TOC entry 4809 (class 1259 OID 105757)
-- Name: idx_ride_requests_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ride_requests_status ON public.ride_requests USING btree (status);


--
-- TOC entry 4823 (class 1259 OID 105826)
-- Name: idx_room_types_location_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_room_types_location_id ON public.room_types USING btree (location_id);


--
-- TOC entry 4828 (class 1259 OID 105824)
-- Name: idx_rooms_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rooms_number ON public.rooms USING btree (number);


--
-- TOC entry 4829 (class 1259 OID 105825)
-- Name: idx_rooms_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rooms_status ON public.rooms USING btree (status);


--
-- TOC entry 4830 (class 1259 OID 105823)
-- Name: idx_rooms_type_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rooms_type_id ON public.rooms USING btree (type_id);


--
-- TOC entry 4812 (class 1259 OID 105759)
-- Name: idx_service_requests_room_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_service_requests_room_number ON public.service_requests USING btree (room_number);


--
-- TOC entry 4813 (class 1259 OID 105760)
-- Name: idx_service_requests_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_service_requests_status ON public.service_requests USING btree (status);


--
-- TOC entry 4814 (class 1259 OID 105761)
-- Name: idx_service_requests_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_service_requests_type ON public.service_requests USING btree (type);


--
-- TOC entry 4846 (class 1259 OID 107019)
-- Name: idx_user_read_messages_lookup; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_read_messages_lookup ON public.user_read_messages USING btree (identifier, service_type);


--
-- TOC entry 4786 (class 1259 OID 105753)
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- TOC entry 4787 (class 1259 OID 105752)
-- Name: idx_users_room_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_room_number ON public.users USING btree (room_number);


--
-- TOC entry 4865 (class 2620 OID 106868)
-- Name: hotel_reviews update_hotel_reviews_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_hotel_reviews_updated_at BEFORE UPDATE ON public.hotel_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4859 (class 2620 OID 105768)
-- Name: knowledge_items update_knowledge_items_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_knowledge_items_updated_at BEFORE UPDATE ON public.knowledge_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4856 (class 2620 OID 105765)
-- Name: locations update_locations_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON public.locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4857 (class 2620 OID 105766)
-- Name: menu_items update_menu_items_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4858 (class 2620 OID 105767)
-- Name: promotions update_promotions_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON public.promotions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4860 (class 2620 OID 105769)
-- Name: resort_events update_resort_events_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_resort_events_updated_at BEFORE UPDATE ON public.resort_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4861 (class 2620 OID 105770)
-- Name: ride_requests update_ride_requests_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_ride_requests_updated_at BEFORE UPDATE ON public.ride_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4863 (class 2620 OID 105827)
-- Name: room_types update_room_types_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_room_types_updated_at BEFORE UPDATE ON public.room_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4864 (class 2620 OID 105828)
-- Name: rooms update_rooms_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4862 (class 2620 OID 105771)
-- Name: service_requests update_service_requests_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_service_requests_updated_at BEFORE UPDATE ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4855 (class 2620 OID 105764)
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4852 (class 2606 OID 105747)
-- Name: chat_messages chat_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 4851 (class 2606 OID 105720)
-- Name: ride_requests ride_requests_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ride_requests
    ADD CONSTRAINT ride_requests_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 4853 (class 2606 OID 105800)
-- Name: room_types room_types_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_types
    ADD CONSTRAINT room_types_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE SET NULL;


--
-- TOC entry 4854 (class 2606 OID 105818)
-- Name: rooms rooms_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.room_types(id) ON DELETE RESTRICT;


-- Completed on 2025-12-09 09:39:39

--
-- PostgreSQL database dump complete
--


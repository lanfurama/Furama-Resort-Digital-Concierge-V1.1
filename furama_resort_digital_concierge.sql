--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

-- Started on 2025-12-03 15:55:48

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
-- TOC entry 869 (class 1247 OID 105600)
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
-- TOC entry 878 (class 1247 OID 105630)
-- Name: location_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.location_type AS ENUM (
    'VILLA',
    'FACILITY',
    'RESTAURANT'
);


ALTER TYPE public.location_type OWNER TO postgres;

--
-- TOC entry 881 (class 1247 OID 105638)
-- Name: message_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.message_role AS ENUM (
    'user',
    'model'
);


ALTER TYPE public.message_role OWNER TO postgres;

--
-- TOC entry 875 (class 1247 OID 105622)
-- Name: service_request_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.service_request_status AS ENUM (
    'PENDING',
    'CONFIRMED',
    'COMPLETED'
);


ALTER TYPE public.service_request_status OWNER TO postgres;

--
-- TOC entry 872 (class 1247 OID 105614)
-- Name: service_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.service_type AS ENUM (
    'DINING',
    'SPA',
    'HOUSEKEEPING'
);


ALTER TYPE public.service_type OWNER TO postgres;

--
-- TOC entry 866 (class 1247 OID 105590)
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
-- TOC entry 237 (class 1255 OID 105184)
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
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ride_requests OWNER TO postgres;

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
    password character varying(255)
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 4931 (class 0 OID 0)
-- Dependencies: 218
-- Name: COLUMN users.password; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.password IS 'Password for staff/admin/driver/supervisor accounts. NULL for guest accounts.';


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
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.chat_messages OWNER TO postgres;

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
-- TOC entry 4932 (class 0 OID 0)
-- Dependencies: 233
-- Name: chat_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.chat_messages_id_seq OWNED BY public.chat_messages.id;


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
-- TOC entry 4933 (class 0 OID 0)
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
-- TOC entry 4934 (class 0 OID 0)
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
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.menu_items OWNER TO postgres;

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
-- TOC entry 4935 (class 0 OID 0)
-- Dependencies: 221
-- Name: menu_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.menu_items_id_seq OWNED BY public.menu_items.id;


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
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.service_requests OWNER TO postgres;

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
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.promotions OWNER TO postgres;

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
-- TOC entry 4936 (class 0 OID 0)
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
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.resort_events OWNER TO postgres;

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
-- TOC entry 4937 (class 0 OID 0)
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
-- TOC entry 4938 (class 0 OID 0)
-- Dependencies: 229
-- Name: ride_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ride_requests_id_seq OWNED BY public.ride_requests.id;


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
-- TOC entry 4939 (class 0 OID 0)
-- Dependencies: 231
-- Name: service_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.service_requests_id_seq OWNED BY public.service_requests.id;


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
-- TOC entry 4940 (class 0 OID 0)
-- Dependencies: 217
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4735 (class 2604 OID 105741)
-- Name: chat_messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages ALTER COLUMN id SET DEFAULT nextval('public.chat_messages_id_seq'::regclass);


--
-- TOC entry 4721 (class 2604 OID 105690)
-- Name: knowledge_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_items ALTER COLUMN id SET DEFAULT nextval('public.knowledge_items_id_seq'::regclass);


--
-- TOC entry 4712 (class 2604 OID 105659)
-- Name: locations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.locations ALTER COLUMN id SET DEFAULT nextval('public.locations_id_seq'::regclass);


--
-- TOC entry 4715 (class 2604 OID 105668)
-- Name: menu_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_items ALTER COLUMN id SET DEFAULT nextval('public.menu_items_id_seq'::regclass);


--
-- TOC entry 4718 (class 2604 OID 105679)
-- Name: promotions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotions ALTER COLUMN id SET DEFAULT nextval('public.promotions_id_seq'::regclass);


--
-- TOC entry 4724 (class 2604 OID 105701)
-- Name: resort_events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resort_events ALTER COLUMN id SET DEFAULT nextval('public.resort_events_id_seq'::regclass);


--
-- TOC entry 4727 (class 2604 OID 105712)
-- Name: ride_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ride_requests ALTER COLUMN id SET DEFAULT nextval('public.ride_requests_id_seq'::regclass);


--
-- TOC entry 4731 (class 2604 OID 105729)
-- Name: service_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_requests ALTER COLUMN id SET DEFAULT nextval('public.service_requests_id_seq'::regclass);


--
-- TOC entry 4708 (class 2604 OID 105647)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 4766 (class 2606 OID 105746)
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- TOC entry 4752 (class 2606 OID 105696)
-- Name: knowledge_items knowledge_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_items
    ADD CONSTRAINT knowledge_items_pkey PRIMARY KEY (id);


--
-- TOC entry 4745 (class 2606 OID 105663)
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- TOC entry 4748 (class 2606 OID 105674)
-- Name: menu_items menu_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_pkey PRIMARY KEY (id);


--
-- TOC entry 4750 (class 2606 OID 105685)
-- Name: promotions promotions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_pkey PRIMARY KEY (id);


--
-- TOC entry 4754 (class 2606 OID 105707)
-- Name: resort_events resort_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resort_events
    ADD CONSTRAINT resort_events_pkey PRIMARY KEY (id);


--
-- TOC entry 4759 (class 2606 OID 105719)
-- Name: ride_requests ride_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ride_requests
    ADD CONSTRAINT ride_requests_pkey PRIMARY KEY (id);


--
-- TOC entry 4764 (class 2606 OID 105736)
-- Name: service_requests service_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_requests
    ADD CONSTRAINT service_requests_pkey PRIMARY KEY (id);


--
-- TOC entry 4740 (class 2606 OID 105652)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4742 (class 2606 OID 105654)
-- Name: users users_room_number_last_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_room_number_last_name_key UNIQUE (room_number, last_name);


--
-- TOC entry 4767 (class 1259 OID 105763)
-- Name: idx_chat_messages_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chat_messages_created_at ON public.chat_messages USING btree (created_at);


--
-- TOC entry 4768 (class 1259 OID 105762)
-- Name: idx_chat_messages_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chat_messages_user_id ON public.chat_messages USING btree (user_id);


--
-- TOC entry 4743 (class 1259 OID 105754)
-- Name: idx_locations_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_locations_name ON public.locations USING btree (name);


--
-- TOC entry 4746 (class 1259 OID 105755)
-- Name: idx_menu_items_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_menu_items_category ON public.menu_items USING btree (category);


--
-- TOC entry 4755 (class 1259 OID 105758)
-- Name: idx_ride_requests_driver_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ride_requests_driver_id ON public.ride_requests USING btree (driver_id);


--
-- TOC entry 4756 (class 1259 OID 105756)
-- Name: idx_ride_requests_room_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ride_requests_room_number ON public.ride_requests USING btree (room_number);


--
-- TOC entry 4757 (class 1259 OID 105757)
-- Name: idx_ride_requests_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ride_requests_status ON public.ride_requests USING btree (status);


--
-- TOC entry 4760 (class 1259 OID 105759)
-- Name: idx_service_requests_room_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_service_requests_room_number ON public.service_requests USING btree (room_number);


--
-- TOC entry 4761 (class 1259 OID 105760)
-- Name: idx_service_requests_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_service_requests_status ON public.service_requests USING btree (status);


--
-- TOC entry 4762 (class 1259 OID 105761)
-- Name: idx_service_requests_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_service_requests_type ON public.service_requests USING btree (type);


--
-- TOC entry 4737 (class 1259 OID 105753)
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- TOC entry 4738 (class 1259 OID 105752)
-- Name: idx_users_room_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_room_number ON public.users USING btree (room_number);


--
-- TOC entry 4775 (class 2620 OID 105768)
-- Name: knowledge_items update_knowledge_items_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_knowledge_items_updated_at BEFORE UPDATE ON public.knowledge_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4772 (class 2620 OID 105765)
-- Name: locations update_locations_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON public.locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4773 (class 2620 OID 105766)
-- Name: menu_items update_menu_items_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4774 (class 2620 OID 105767)
-- Name: promotions update_promotions_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON public.promotions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4776 (class 2620 OID 105769)
-- Name: resort_events update_resort_events_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_resort_events_updated_at BEFORE UPDATE ON public.resort_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4777 (class 2620 OID 105770)
-- Name: ride_requests update_ride_requests_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_ride_requests_updated_at BEFORE UPDATE ON public.ride_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4778 (class 2620 OID 105771)
-- Name: service_requests update_service_requests_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_service_requests_updated_at BEFORE UPDATE ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4771 (class 2620 OID 105764)
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4770 (class 2606 OID 105747)
-- Name: chat_messages chat_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 4769 (class 2606 OID 105720)
-- Name: ride_requests ride_requests_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ride_requests
    ADD CONSTRAINT ride_requests_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.users(id) ON DELETE SET NULL;


-- Completed on 2025-12-03 15:55:48

--
-- PostgreSQL database dump complete
--


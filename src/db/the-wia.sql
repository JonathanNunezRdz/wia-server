CREATE TYPE "waifu_level" AS ENUM (
  'top_waifu',
  'jonin',
  'chunin',
  'genin',
  'free_agent'
);

CREATE TYPE "media_type" AS ENUM (
  'anime',
  'manga',
  'videogame'
);

CREATE TYPE "trade_status" AS ENUM (
  'pending',
  'rejected',
  'accepted'
);

CREATE TYPE "activity_type" AS ENUM (
  'trade',
  'media'
);

CREATE TABLE "user" (
  "id" SERIAL PRIMARY KEY,
  "alias" varchar NOT NULL,
  "name" varchar NOT NULL,
  "last_name" varchar NOT NULL,
  "uid" varchar UNIQUE NOT NULL,
  "has_image" boolean NOT NULL DEFAULT false,
  "image_path" varchar
);

CREATE TABLE "media" (
  "id" SERIAL PRIMARY KEY,
  "title" varchar UNIQUE NOT NULL,
  "type" media_type NOT NULL
);

CREATE TABLE "known_media" (
  "user_id" int NOT NULL,
  "media_id" int NOT NULL,
  "known_at" date NOT NULL
);

CREATE TABLE "waifu" (
  "id" SERIAL PRIMARY KEY,
  "name" varchar NOT NULL,
  "level" waifu_level NOT NULL,
  "owner_id" int NOT NULL,
  "media_id" int NOT NULL,
  "has_image" boolean NOT NULL DEFAULT false,
  "image_path" varchar,
  "since" date NOT NULL
);

CREATE TABLE "trade" (
  "id" SERIAL PRIMARY KEY,
  "sender_id" int NOT NULL,
  "receiver_id" int NOT NULL,
  "has_contract" boolean NOT NULL,
  "status" trade_status NOT NULL DEFAULT (pending),
  "created_at" date DEFAULT (now()),
  "succeeded_at" date,
  "rejected_at" date
);

CREATE TABLE "waifu_trade" (
  "trade_id" int NOT NULL,
  "waifu_id" int NOT NULL
);

CREATE TABLE "contract" (
  "media_id" int NOT NULL,
  "trade_id" int NOT NULL,
  "user_id" int NOT NULL,
  "due" date NOT NULL
);

CREATE TABLE "activity" (
  "id" SERIAL PRIMARY KEY,
  "type" activity_type,
  "created_at" date DEFAULT (now())
);

CREATE TABLE "media_activity" (
  "activity_id" int NOT NULL,
  "user_id" int NOT NULL,
  "media_id" int NOT NULL
);

CREATE TABLE "waifu_activity" (
  "activity_id" int NOT NULL,
  "user_id" int NOT NULL,
  "waifu_id" int NOT NULL,
  "waifu_level" waifu_level,
  "is_new" boolean NOT NULL DEFAULT false
);

CREATE TABLE "trade_activity" (
  "activity_id" int NOT NULL,
  "trade_id" int NOT NULL
);

ALTER TABLE "known_media" ADD FOREIGN KEY ("user_id") REFERENCES "user" ("id");

ALTER TABLE "known_media" ADD FOREIGN KEY ("media_id") REFERENCES "media" ("id");

ALTER TABLE "waifu" ADD FOREIGN KEY ("owner_id") REFERENCES "user" ("id");

ALTER TABLE "waifu" ADD FOREIGN KEY ("media_id") REFERENCES "media" ("id");

ALTER TABLE "trade" ADD FOREIGN KEY ("sender_id") REFERENCES "user" ("id");

ALTER TABLE "trade" ADD FOREIGN KEY ("receiver_id") REFERENCES "user" ("id");

ALTER TABLE "waifu_trade" ADD FOREIGN KEY ("trade_id") REFERENCES "trade" ("id");

ALTER TABLE "waifu_trade" ADD FOREIGN KEY ("waifu_id") REFERENCES "waifu" ("id");

ALTER TABLE "contract" ADD FOREIGN KEY ("media_id") REFERENCES "media" ("id");

ALTER TABLE "contract" ADD FOREIGN KEY ("trade_id") REFERENCES "trade" ("id");

ALTER TABLE "contract" ADD FOREIGN KEY ("user_id") REFERENCES "user" ("id");

ALTER TABLE "media_activity" ADD FOREIGN KEY ("activity_id") REFERENCES "activity" ("id");

ALTER TABLE "media_activity" ADD FOREIGN KEY ("user_id") REFERENCES "user" ("id");

ALTER TABLE "media_activity" ADD FOREIGN KEY ("media_id") REFERENCES "media" ("id");

ALTER TABLE "waifu_activity" ADD FOREIGN KEY ("activity_id") REFERENCES "activity" ("id");

ALTER TABLE "waifu_activity" ADD FOREIGN KEY ("user_id") REFERENCES "user" ("id");

ALTER TABLE "waifu_activity" ADD FOREIGN KEY ("waifu_id") REFERENCES "waifu" ("id");

ALTER TABLE "trade_activity" ADD FOREIGN KEY ("activity_id") REFERENCES "activity" ("id");

ALTER TABLE "trade_activity" ADD FOREIGN KEY ("trade_id") REFERENCES "trade" ("id");

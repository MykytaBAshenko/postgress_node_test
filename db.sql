CREATE DATABASE postgresnodetest;

CREATE TABLE "User"(
  id bigserial primary key,
  username VARCHAR(50) NOT NULL UNIQUE, 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP 
);

CREATE TABLE "Chat"(
    id bigserial primary key,
    name VARCHAR(50) NOT NULL UNIQUE,
    users int[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Message"(
    id bigserial primary key,
    chat bigserial NOT NULL,
    author bigserial NOT NULL,
    text VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat) REFERENCES "Chat"(id),
    FOREIGN KEY (author) REFERENCES "User"(id)
);


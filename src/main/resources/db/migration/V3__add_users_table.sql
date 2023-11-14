CREATE TABLE users (
                       id         UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
                       email      VARCHAR(255) NOT NULL UNIQUE,
                       password   VARCHAR(255),
                       name       VARCHAR(255),
                       role       VARCHAR(20)  NOT NULL DEFAULT 'USER',
                       auth_provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL',
                       created_at TIMESTAMP    DEFAULT now()
);
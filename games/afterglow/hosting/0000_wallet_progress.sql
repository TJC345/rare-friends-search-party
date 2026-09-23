CREATE TABLE `wallet_progress` (
  `wallet` text NOT NULL,
  `friend_id` text NOT NULL,
  `game` text NOT NULL,
  `state` text NOT NULL,
  `updated_at` integer NOT NULL,
  PRIMARY KEY (`wallet`, `friend_id`, `game`)
);

import mysql from 'mysql';
import config from '../config';
import { _queryAsync } from '../db/db';

export const seedDb = async () => {
  const db = mysql.createConnection(config.mysql.connectionOptions);

  await _queryAsync<any>(db, 'CREATE DATABASE IF NOT EXISTS slack');

  await _queryAsync<any>(db, 'USE slack');

  await _queryAsync<any>(
    db,
    `CREATE TABLE IF NOT EXISTS user (
        id INT(8) PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(24) NOT NULL,
        displayName VARCHAR(24) NOT NULL,
        pass TINYTEXT NOT NULL,
        UNIQUE (username)
      )`
  );

  await _queryAsync<any>(
    db,
    `CREATE TABLE IF NOT EXISTS blacklist (
        id INT(8) PRIMARY KEY AUTO_INCREMENT,
        token TEXT NOT NULL,
        insertDate BIGINT NOT NULL
      )`
  );

  await _queryAsync<any>(
    db,
    `CREATE TABLE IF NOT EXISTS server (
        id INT(8) AUTO_INCREMENT,
        name TINYTEXT NOT NULL,
        ownerUserId INT(8) NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY (ownerUserId) REFERENCES user(id)
      )`
  );

  await _queryAsync<any>(
    db,
    `CREATE TABLE IF NOT EXISTS channel (
        id INT(8) AUTO_INCREMENT,
        serverId INT(8),
        name TINYTEXT NOT NULL,
        isPrivate BOOLEAN NOT NULL,
        topic TEXT DEFAULT NULL,
        description TEXT DEFAULT NULL,
        autoAddNewMembers BOOLEAN NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY (serverId) REFERENCES server(id) ON DELETE CASCADE
      )`
  );

  await _queryAsync<any>(
    db,
    `CREATE TABLE IF NOT EXISTS link_server_user (
        serverId INT(8) NOT NULL,
        userId INT(8) NOT NULL,
        FOREIGN KEY (serverId) REFERENCES server(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE,
        UNIQUE(serverId, userId)
      )`
  );

  await _queryAsync<any>(
    db,
    `CREATE TABLE IF NOT EXISTS link_channel_user (
        channelId INT(8) NOT NULL,
        userId INT(8) NOT NULL,
        lastAccess DATETIME DEFAULT NULL,
        FOREIGN KEY (channelId) REFERENCES channel(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE,
        UNIQUE(channelId, userId)
      )`
  );

  await _queryAsync<any>(
    db,
    `CREATE TABLE IF NOT EXISTS message (
        id INT(12) AUTO_INCREMENT,
        contentType INT(1) NOT NULL,
        timestamp BIGINT NOT NULL,
        content TEXT DEFAULT NULL,
        userId INT(8) DEFAULT NULL,
        channelId INT(8) NOT NULL,
        deleted BOOLEAN DEFAULT 0,
        quoteMsgId INT(12) DEFAULT NULL,
        threadParentMessageId INT(12) DEFAULT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY (userId) REFERENCES user(id),
        FOREIGN KEY (channelId) REFERENCES channel(id)
      )`
  );

  await _queryAsync<any>(
    db,
    `CREATE TABLE IF NOT EXISTS client (
        socketId VARCHAR(20) PRIMARY KEY NOT NULL,
        userId INT(8) DEFAULT NULL,
        serverId INT(8) DEFAULT NULL,
        channelId INT(8) DEFAULT NULL,
        FOREIGN KEY (userId) REFERENCES user(id),
        FOREIGN KEY (channelId) REFERENCES channel(id),
        FOREIGN KEY (serverId) REFERENCES server(id)
      )`
  );

  await _queryAsync<any>(
    db,
    `CREATE TABLE IF NOT EXISTS invite (
        id INT(8) PRIMARY KEY AUTO_INCREMENT,
        userId INT(8) NOT NULL,
        inviterId INT(8) NOT NULL,
        type INT(1) NOT NULL,
        serverId INT(8) DEFAULT NULL,
        channelId INT(8) DEFAULT NULL,
        FOREIGN KEY (userId) REFERENCES user(id),
        FOREIGN KEY (inviterId) REFERENCES user(id),
        FOREIGN KEY (channelId) REFERENCES channel(id),
        FOREIGN KEY (serverId) REFERENCES server(id)
      )`
  );

  console.log('seeded db');
  db.end();
};

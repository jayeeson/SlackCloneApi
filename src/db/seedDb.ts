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
        username TINYTEXT NOT NULL,
        displayName TINYTEXT NOT NULL,
        pass TINYTEXT NOT NULL
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
    `CREATE TABLE IF NOT EXISTS message (
        id INT(12) AUTO_INCREMENT,
        contentType VARCHAR(6) NOT NULL,
        time DATETIME NOT NULL,
        content TEXT DEFAULT NULL,
        originalMsgId INT(12) DEFAULT NULL,
        userId INT(8) DEFAULT NULL,
        channelId INT(8) NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY (userId) REFERENCES user(id),
        FOREIGN KEY (channelId) REFERENCES channel(id)
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
        content TEXT DEFAULT NULL,
        private BOOLEAN DEFAULT NULL,
        topic TEXT DEFAULT NULL,
        welcomeMsg TEXT DEFAULT NULL,
        description TEXT DEFAULT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY (serverId) REFERENCES server(id)
      )`
  );

  await _queryAsync<any>(
    db,
    `CREATE TABLE IF NOT EXISTS link_server_user (
        serverId INT(8) NOT NULL,
        userId INT(8) NOT NULL,
        FOREIGN KEY (serverId) REFERENCES server(id),
        FOREIGN KEY (userId) REFERENCES user(id)
      )`
  );

  await _queryAsync<any>(
    db,
    `CREATE TABLE IF NOT EXISTS link_channel_user (
        channelId INT(8) NOT NULL,
        userId INT(8) NOT NULL,
        lastAccess DATETIME DEFAULT NULL,
        FOREIGN KEY (channelId) REFERENCES channel(id),
        FOREIGN KEY (userId) REFERENCES user(id)
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

  console.log('seeded db');
  db.end();
};

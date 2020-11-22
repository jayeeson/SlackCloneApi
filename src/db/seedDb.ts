import mysql from 'mysql';
import config from '../config';

export const seedDb = (): Promise<mysql.MysqlError | void> => {
  const db = mysql.createConnection(config.mysql.connectionOptions);

  return new Promise((resolve, reject) => {
    db.query('CREATE DATABASE IF NOT EXISTS slack', err => {
      if (err) {
        reject(err);
      }

      db.query('USE slack');

      db.query(`CREATE TABLE IF NOT EXISTS user (
        id INT(8) PRIMARY KEY AUTO_INCREMENT,
        name TINYTEXT NOT NULL,
        pass TINYTEXT NOT NULL
      )`);

      db.query(`CREATE TABLE IF NOT EXISTS message (
        id INT(12) AUTO_INCREMENT,
        contentType VARCHAR(6) NOT NULL,
        time TINYTEXT NOT NULL,
        content TEXT DEFAULT NULL,
        originalMsgId INT(12) DEFAULT NULL,
        userId INT(8) DEFAULT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY (userId) REFERENCES user(id)
      )`);

      db.query(`CREATE TABLE IF NOT EXISTS server (
        id INT(8) AUTO_INCREMENT,
        name TINYTEXT NOT NULL,
        owner INT(8) NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY (owner) REFERENCES user(id)
      )`);

      db.query(`CREATE TABLE IF NOT EXISTS channel (
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
      )`);

      db.query(`CREATE TABLE IF NOT EXISTS link_server_channel (
        serverId INT(8) NOT NULL,
        channelId INT(8) NOT NULL,
        FOREIGN KEY (serverId) REFERENCES server(id),
        FOREIGN KEY (channelId) REFERENCES channel(id)
      )`);

      db.query(`CREATE TABLE IF NOT EXISTS link_channel_user (
        channelId INT(8) NOT NULL,
        userId INT(8) NOT NULL,
        FOREIGN KEY (channelId) REFERENCES channel(id),
        FOREIGN KEY (userId) REFERENCES user(id)
      )`);

      resolve();
    });
  });
};

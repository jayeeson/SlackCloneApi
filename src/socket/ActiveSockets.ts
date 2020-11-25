import _ from 'lodash';
import { Socket } from 'socket.io';

export class ActiveSockets {
  sockets: { [idx: number]: Socket } = {};

  add = (socket: Socket) => {
    this.sockets = { ...this.sockets, [socket.id]: socket };
  };

  remove = (id: string) => {
    _.omit(this.sockets, id);
  };
}

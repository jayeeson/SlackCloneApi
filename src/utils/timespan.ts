import ms from 'ms';
import { CustomError } from '../CustomError';
import { ErrorTypes } from '../types';

const timespan = (time: number | string, iat: number) => {
  const timestamp = iat || Math.floor(Date.now());

  if (typeof time === 'string') {
    const milliseconds = ms(time);
    if (typeof milliseconds === 'undefined') {
      throw new CustomError(500, 'Server configuration error', ErrorTypes.CONFIG);
    }
    return Math.floor(timestamp + milliseconds);
  } else if (typeof time === 'number') {
    return timestamp + time;
  } else {
    throw new CustomError(500, 'Server configuration error', ErrorTypes.CONFIG);
  }
};

export default timespan;

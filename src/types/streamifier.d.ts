declare module 'streamifier' {
  import { Readable } from 'stream';
  function createReadStream(buffer: Buffer): Readable;
  namespace streamifier {
    export { createReadStream };
  }
  export = streamifier;
}

import Busboy from 'busboy';

/**
 * Parses a single file from a Node request.
 *
 * @param {http.IncommingRequest} req
 * @param opts Busboy configuration object
 * @return {Promise<{ file: Stream, filename: string>}
 */
export default function parse(req, opts) {
  return new Promise((resolve, reject) => {
    const busboy = new Busboy({
      headers: req.headers,
      ...opts,
    });

    function onFile(fieldname, file, filename) {
      // eslint-disable-next-line no-use-before-define
      cleanup();
      resolve({ file, filename });
    }

    function onError(err) {
      // eslint-disable-next-line no-use-before-define
      cleanup();
      reject(err);
    }

    function cleanup() {
      busboy.removeListener('file', onFile);
      busboy.removeListener('error', onError);
    }

    busboy.once('file', onFile);
    busboy.once('error', onError);
    req.pipe(busboy);
  });
}

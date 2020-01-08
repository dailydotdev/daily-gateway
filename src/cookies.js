// eslint-disable-next-line import/prefer-default-export
export const addSubdomainOpts = (ctx, opts) => {
  const host = ctx.request.hostname;
  const parts = host.split('.');
  while (parts.length > 2) {
    parts.shift();
  }
  const domain = parts.join('.');
  return Object.assign({}, opts, { domain });
};

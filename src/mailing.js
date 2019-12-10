const client = require('@sendgrid/client');

if (process.env.SENDGRID_API_KEY) {
  client.setApiKey(process.env.SENDGRID_API_KEY);
}

const profileToContact = (profile) => {
  const contact = { email: profile.email, custom_fields: { e1_T: profile.id } };
  if (profile.name) {
    const split = profile.name.split(' ');
    [contact.first_name] = split;
    contact.last_name = split.slice(1).join(' ');
  }
  return contact;
};

// eslint-disable-next-line import/prefer-default-export
export const addUserToContacts = (profile, lists) => {
  const request = {
    method: 'PUT',
    url: '/v3/marketing/contacts',
    body: {
      list_ids: [lists],
      contacts: [profileToContact(profile)],
    },
  };
  return client.request(request);
};

const client = require('@sendgrid/client');

if (process.env.SENDGRID_API_KEY) {
  client.setApiKey(process.env.SENDGRID_API_KEY);
}

const profileToContact = (profile, contactId) => {
  let contact = {};
  if (profile) {
    contact = { email: profile.email, custom_fields: { e1_T: profile.id } };
    if (profile.name) {
      const split = profile.name.split(' ');
      [contact.first_name] = split;
      contact.last_name = split.slice(1).join(' ');
    }
  }
  if (contactId) {
    contact.id = contactId;
  }
  return contact;
};

export const addUserToContacts = (profile, lists, contactId) => {
  const request = {
    method: 'PUT',
    url: '/v3/marketing/contacts',
    body: {
      list_ids: lists ? [lists] : undefined,
      contacts: [profileToContact(profile, contactId)],
    },
  };
  return client.request(request);
};

export const removeUserFromList = (list, contactId) => {
  const request = {
    method: 'DELETE',
    url: `/v3/marketing/lists/${list}/contacts?contact_ids=${contactId}`,
  };
  return client.request(request);
};

export const removeUserContact = (contactId) => {
  const request = {
    method: 'DELETE',
    url: `/v3/marketing/contacts?ids=${contactId}`,
  };
  return client.request(request);
};

export const getContactIdByEmail = async (email) => {
  if (email) {
    const request = {
      method: 'POST',
      url: '/v3/marketing/contacts/search',
      body: {
        query: `email = '${email}'`,
      },
    };
    const [, body] = await client.request(request);
    if (body && body.result && body.result.length) {
      return body.result[0].id;
    }
  }
  return null;
};

export const updateUserContact = async (newProfile, oldEmail, list) => {
  const contactId = await getContactIdByEmail(oldEmail);
  return addUserToContacts(newProfile, list, contactId);
};

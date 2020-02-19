const accts = [
  {
    id: '00001',
    email: 'admin@email.com',
    password: 'P@ssw0rd'
  },
  {
    id: '00002',
    email: 'admin1@email.com',
    password: 'P@ssw0rd'
  },
  {
    id: '00003',
    email: 'admin2@email.com',
    password: 'P@ssw0rd'
  },
]

module.exports.login = (email, password) => { 
  return accts.find((acct) => acct.email === email && acct.password === password);
};
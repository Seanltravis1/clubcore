/**
 * Checks if a user has access to a given section/action based on their role.
 * @param {object} clubUser - Must have a 'role' property (e.g. { role: 'admin' })
 * @param {object} permissions - Permissions map (section > action > array of allowed roles)
 * @param {string} section - Section name (e.g. 'members', 'events', 'news')
 * @param {string} action - Action (default: 'view')
 * @returns {boolean}
 */
export default function hasAccess(clubUser, permissions, section, action = 'view') {
  // Debug logging
  console.log('--- hasAccess ---');
  console.log('clubUser:', clubUser);
  console.log('permissions:', permissions);
  console.log('section:', section, '| action:', action);

  // User must exist and have a role
  if (!clubUser) {
    console.warn('⛔ clubUser missing');
    return false;
  }
  if (!clubUser.role) {
    console.warn('⛔ clubUser.role missing');
    return false;
  }

  // Permissions for section and action must exist
  if (!permissions || !permissions[section] || !permissions[section][action]) {
    console.warn(`⛔ permissions missing for ${section} ${action}`);
    return false;
  }

  // Allowed roles for this section/action
  const allowedRoles = permissions[section][action];
  if (!Array.isArray(allowedRoles)) {
    console.warn(`⛔ allowedRoles for ${section}.${action} is not an array`);
    return false;
  }

  // Role match (case-insensitive)
  const userRole = clubUser.role.toLowerCase();
  const allowedLower = allowedRoles.map(r => r.toLowerCase());

  if (allowedLower.includes(userRole)) {
    console.log(`✅ Access granted: ${userRole} found in allowed roles.`);
    return true;
  } else {
    console.warn(`⛔ Access denied: ${userRole} not in [${allowedLower.join(', ')}]`);
    return false;
  }
}

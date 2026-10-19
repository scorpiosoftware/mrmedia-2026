/** Whether a signed-in user (as returned by /spa/user) holds a permission. Falsy permission → always. */
export function userCan(user, permission) {
    if (!permission) return true;
    if (!user) return false;
    return user.is_super_admin || (user.permissions ?? []).includes(permission);
}

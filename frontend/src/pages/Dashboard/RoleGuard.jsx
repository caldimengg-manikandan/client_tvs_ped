import React from 'react';
import { useAuth } from '../../context/AuthContext';

/**
 * RoleGuard — renders children only when the current user matches the given role(s) or permission.
 * Props:
 *   roles     {string|string[]}  — required role(s)
 *   permission {string}          — OR: check a permission key
 *   fallback  {ReactNode}        — what to render when access is denied (default: null)
 */
const RoleGuard = ({ roles, permission, fallback = null, children }) => {
    const { user, hasPermission, hasRole } = useAuth();
    if (!user) return fallback;
    if (roles) {
        const roleList = Array.isArray(roles) ? roles : [roles];
        if (!roleList.includes(user.role)) return fallback;
    }
    if (permission && !hasPermission(permission)) return fallback;
    return <>{children}</>;
};

export default RoleGuard;

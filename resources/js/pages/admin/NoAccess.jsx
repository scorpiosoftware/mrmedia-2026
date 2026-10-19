import { ShieldOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { useApp } from '@/context/AppContext';
import { homePathFor } from '@/lib/admin-sections';

/** Shown when a signed-in user opens a dashboard section their roles don't grant. */
export default function AdminNoAccess() {
    const { user } = useApp();

    return (
        <AdminLayout title="No access">
            <div className="py-24 text-center text-[#5A6A9A]">
                <ShieldOff size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium text-[#0D1B4B]">
                    You don't have permission to open this section
                </p>
                <p className="mb-6 text-sm">
                    Ask an administrator to grant it from the Users page.
                </p>
                <Link
                    to={homePathFor(user)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#213C93] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#2E52C9]"
                >
                    Go to dashboard
                </Link>
            </div>
        </AdminLayout>
    );
}

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Check, X } from 'lucide-react';

interface PendingUser {
  id: string; full_name: string | null; email: string; code: string | null;
  id_front_url: string | null; id_back_url: string | null; created_at: string;
  frontSigned?: string | null; backSigned?: string | null;
}

const sign = async (path: string | null) => {
  if (!path) return null;
  const { data } = await supabase.storage.from('id-documents').createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
};

const PendingApprovalsPanel = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('user_profiles')
      .select('id, full_name, email, code, id_front_url, id_back_url, created_at')
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    const rows: PendingUser[] = await Promise.all((data || []).map(async (u: PendingUser) => ({
      ...u, frontSigned: await sign(u.id_front_url), backSigned: await sign(u.id_back_url),
    })));
    setUsers(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`pending-users-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const decide = async (id: string, status: 'approved' | 'rejected') => {
    const { error } = await (supabase as any).from('user_profiles').update({ approval_status: status }).eq('id', id);
    if (error) {
      toast({ title: 'Could not update', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: status === 'approved' ? 'User approved' : 'User rejected' });
    load();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          New Users Awaiting Approval
          {users.length > 0 && <Badge variant="destructive">{users.length}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> :
         users.length === 0 ? <p className="text-sm text-muted-foreground">No one is waiting for approval.</p> :
         users.map((u) => (
          <div key={u.id} className="rounded-md border p-4 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{u.full_name || '(no name)'}</p>
                <p className="text-sm text-muted-foreground">{u.email}</p>
                <p className="text-sm">ID: <span className="font-mono">{u.code || '—'}</span></p>
                <p className="text-xs text-muted-foreground">Registered {new Date(u.created_at).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => decide(u.id, 'approved')}><Check className="h-4 w-4 mr-1" />Approve</Button>
                <Button size="sm" variant="outline" onClick={() => decide(u.id, 'rejected')}><X className="h-4 w-4 mr-1" />Reject</Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[['ID Front', u.frontSigned], ['ID Back', u.backSigned]].map(([label, url]) => (
                <div key={label as string}>
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  {url ? <a href={url as string} target="_blank" rel="noreferrer"><img src={url as string} alt={label as string} className="w-full h-36 object-cover rounded border" /></a>
                       : <div className="h-36 rounded border flex items-center justify-center text-xs text-muted-foreground">Not uploaded</div>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default PendingApprovalsPanel;

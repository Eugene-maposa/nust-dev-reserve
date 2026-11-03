import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CardScannerForm from '@/components/auth/components/CardScannerForm';
import { UserPlus, X } from 'lucide-react';

interface PendingScan { id: string; scanned_code: string; created_at: string }

const ScanIdPanel = () => {
  const [pending, setPending] = useState<PendingScan[]>([]);
  const [selectedCode, setSelectedCode] = useState<string | undefined>();
  const [formKey, setFormKey] = useState(0);

  const load = useCallback(async () => {
    const { data } = await (supabase as any)
      .from('unregistered_scans')
      .select('id, scanned_code, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    setPending(data || []);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`unregistered-scans-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'unregistered_scans' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const markDone = async (code: string, status = 'registered') => {
    await (supabase as any).from('unregistered_scans').update({ status }).eq('scanned_code', code).eq('status', 'pending');
    load();
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Unregistered ID Scans
            {pending.length > 0 && <Badge variant="destructive">{pending.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">No one is waiting to be registered.</p>
          ) : pending.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-2 rounded-md border p-3">
              <div>
                <p className="font-mono text-sm">{p.scanned_code}</p>
                <p className="text-xs text-muted-foreground">Scanned {new Date(p.created_at).toLocaleString()}</p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" onClick={() => { setSelectedCode(p.scanned_code); setFormKey(k => k + 1); }}>
                  <UserPlus className="h-4 w-4 mr-1" /> Register
                </Button>
                <Button size="icon" variant="ghost" aria-label="Dismiss" onClick={() => markDone(p.scanned_code, 'dismissed')}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Scan ID Card</CardTitle></CardHeader>
        <CardContent>
          <CardScannerForm key={formKey} initialCode={selectedCode} onRegistered={(c) => markDone(c)} />
        </CardContent>
      </Card>
    </div>
  );
};

export default ScanIdPanel;

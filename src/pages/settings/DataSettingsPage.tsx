import type { ChangeEvent } from 'react';

import { Button } from '@components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@components/ui/card';
import { Separator } from '@components/ui/separator';
import { Download, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { toast } from 'sonner';

import { useAuth } from '../../contexts/useAuth';
import { deleteAccount } from '../../firebase/auth';
import {
  deleteAllUserData,
  importAllUserData,
  loadAllUserData,
} from '../../firebase/database';
import { validateImportData } from '../../lib/validate-import';

export const DataSettingsPage = () => {
  const { t } = useTranslation();
  const { user, isAdmin } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadData = async () => {
    if (!user) {
      return;
    }

    try {
      const allData = await loadAllUserData(user.uid);
      const blob = new Blob([JSON.stringify(allData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `preworkout-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t('settings.dataAccount.downloadSuccess'));
    } catch {
      toast.error(t('settings.dataAccount.downloadError'));
    }
  };

  const handleImportData = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) {
      return;
    }

    const file = e.target.files[0];
    e.target.value = '';

    try {
      const text = await file.text();
      const data = JSON.parse(text) as unknown;

      if (!validateImportData(data)) {
        throw new Error('Invalid format');
      }

      const confirmed = window.confirm(t('settings.dataAccount.importConfirm'));
      if (!confirmed) {
        return;
      }

      await importAllUserData(user.uid, data);
      toast.success(t('settings.dataAccount.importSuccess'));
      window.location.reload();
    } catch {
      toast.error(t('settings.dataAccount.importError'));
    }
  };

  const handleDeleteData = async () => {
    if (!user) {
      return;
    }

    const confirmed = window.confirm(
      t('settings.dataAccount.deleteDataConfirm'),
    );
    if (!confirmed) {
      return;
    }

    try {
      await deleteAllUserData(user.uid);
      toast.success(t('settings.dataAccount.deleteDataSuccess'));
    } catch {
      toast.error(t('settings.dataAccount.deleteDataError'));
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) {
      return;
    }

    const confirmed = window.confirm(
      t('settings.dataAccount.deleteAccountConfirm'),
    );
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAllUserData(user.uid);
      await deleteAccount();
      toast.success(t('settings.dataAccount.deleteAccountSuccess'));
    } catch {
      toast.error(t('settings.dataAccount.deleteAccountError'));
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={
        'mx-auto w-full max-w-3xl flex flex-1 flex-col gap-4 p-4 lg:gap-8 lg:p-6'
      }
    >
      <div className={'space-y-1'}>
        <h1 className={'text-3xl font-bold tracking-tight'}>
          {t('settings.data.pageTitle')}
        </h1>

        <p className={'text-muted-foreground'}>
          {t('settings.data.pageDescription')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.dataAccount.title')}</CardTitle>

          <CardDescription>
            {t('settings.dataAccount.description')}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className={'flex flex-col gap-3 sm:flex-row'}>
            <Button onClick={handleDownloadData} variant={'outline'}>
              <Download className={'mr-2 h-4 w-4'} />
              {t('settings.dataAccount.downloadData')}
            </Button>

            {isAdmin && (
              <>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant={'outline'}
                >
                  <Upload className={'mr-2 h-4 w-4'} />
                  {t('settings.dataAccount.importData')}
                </Button>

                <input
                  accept={'.json'}
                  className={'hidden'}
                  onChange={handleImportData}
                  ref={fileInputRef}
                  type={'file'}
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className={'border-destructive/50'}>
        <CardHeader>
          <CardTitle className={'text-destructive'}>
            {t('settings.dangerZone.title')}
          </CardTitle>

          <CardDescription>
            {t('settings.dangerZone.description')}
          </CardDescription>
        </CardHeader>

        <CardContent className={'space-y-4'}>
          {isAdmin && (
            <>
              <div className={'flex items-center justify-between'}>
                <div>
                  <p className={'text-sm font-medium'}>
                    {t('settings.dataAccount.deleteData')}
                  </p>
                  <p className={'text-sm text-muted-foreground'}>
                    {t('settings.dangerZone.deleteDataDescription')}
                  </p>
                </div>

                <Button
                  className={'ml-4 shrink-0'}
                  onClick={handleDeleteData}
                  variant={'outline'}
                >
                  <Trash2 className={'mr-2 h-4 w-4'} />
                  {t('settings.dataAccount.deleteData')}
                </Button>
              </div>

              <Separator />
            </>
          )}

          <div className={'flex items-center justify-between'}>
            <div>
              <p className={'text-sm font-medium'}>
                {t('settings.dataAccount.deleteAccount')}
              </p>
              <p className={'text-sm text-muted-foreground'}>
                {t('settings.dataAccount.deleteAccountDescription')}
              </p>
            </div>

            <Button
              className={'ml-4 shrink-0'}
              disabled={isDeleting}
              onClick={handleDeleteAccount}
              variant={'destructive'}
            >
              <Trash2 className={'mr-2 h-4 w-4'} />
              {t('settings.dataAccount.deleteAccount')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className={'flex justify-center gap-4 text-sm'}>
        <Link
          to={'/privacy'}
          className={
            'text-muted-foreground hover:text-primary underline underline-offset-4'
          }
        >
          {t('legal.privacyPolicy')}
        </Link>

        <Link
          to={'/terms'}
          className={
            'text-muted-foreground hover:text-primary underline underline-offset-4'
          }
        >
          {t('legal.termsOfService')}
        </Link>
      </div>
    </div>
  );
};

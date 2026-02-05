import type { UserSettings } from '../contexts/SettingsContext';

import { Avatar, AvatarFallback, AvatarImage } from '@components/ui/avatar';
import { Button } from '@components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@components/ui/card';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { RadioGroup, RadioGroupItem } from '@components/ui/radio-group';
import { Separator } from '@components/ui/separator';
import { Camera, Download, Loader2, Save, Trash2, Upload } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { toast } from 'sonner';

import { useAuth } from '../contexts/useAuth';
import { useSettings } from '../contexts/useSettings';
import { deleteAccount } from '../firebase/auth';
import {
  type AllUserData,
  deleteAllUserData,
  importAllUserData,
  loadAllUserData,
} from '../firebase/database';
import { cropToSquareDataUrl } from '../lib/image';

export const SettingsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { settings, saveSettings } = useSettings();
  const [formData, setFormData] = useState<UserSettings>(settings);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const displayName = formData.name || t('nav.anonymous');
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const hasChanges = useMemo(
    () =>
      formData.name !== settings.name ||
      formData.age !== settings.age ||
      formData.height !== settings.height ||
      formData.sex !== settings.sex,
    [formData, settings],
  );

  const handleChange = (field: keyof UserSettings, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) {
      return;
    }

    const file = e.target.files[0];
    e.target.value = '';

    if (!file.type.startsWith('image/')) {
      toast.error(t('settings.avatar.invalidType'));

      return;
    }

    setIsUploadingAvatar(true);
    try {
      const avatarUrl = await cropToSquareDataUrl(file);
      const updated = { ...formData, avatarUrl };
      setFormData(updated);
      await saveSettings(updated);
      toast.success(t('settings.avatar.uploadSuccess'));
    } catch {
      toast.error(t('settings.avatar.uploadError'));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (!user) {
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const updated = { ...formData, avatarUrl: '' };
      setFormData(updated);
      await saveSettings(updated);
      toast.success(t('settings.avatar.removeSuccess'));
    } catch {
      toast.error(t('settings.avatar.removeError'));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    await saveSettings(formData);
    toast.success(t('settings.savedSuccess'));
  };

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

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) {
      return;
    }

    const file = e.target.files[0];
    e.target.value = '';

    try {
      const text = await file.text();
      const data = JSON.parse(text) as AllUserData;

      if (!data || typeof data !== 'object') {
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
    <div className={'mx-auto w-full max-w-3xl flex flex-1 flex-col gap-8 p-6'}>
      <div className={'space-y-1'}>
        <h1 className={'text-3xl font-bold tracking-tight'}>
          {t('settings.title')}
        </h1>

        <p className={'text-muted-foreground'}>{t('settings.description')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.personalInfo.title')}</CardTitle>

          <CardDescription>
            {t('settings.personalInfo.description')}
          </CardDescription>
        </CardHeader>

        <CardContent className={'space-y-4'}>
          <div className={'flex items-center gap-4'}>
            <div className={'relative'}>
              <Avatar className={'h-20 w-20 rounded-lg'}>
                <AvatarImage alt={displayName} src={formData.avatarUrl} />

                <AvatarFallback className={'rounded-lg text-lg'}>
                  {initials}
                </AvatarFallback>
              </Avatar>

              <button
                disabled={isUploadingAvatar}
                onClick={() => avatarInputRef.current?.click()}
                type={'button'}
                className={
                  'absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50'
                }
              >
                {isUploadingAvatar ? (
                  <Loader2 className={'h-3.5 w-3.5 animate-spin'} />
                ) : (
                  <Camera className={'h-3.5 w-3.5'} />
                )}
              </button>

              <input
                accept={'image/*'}
                className={'hidden'}
                onChange={handleAvatarUpload}
                ref={avatarInputRef}
                type={'file'}
              />
            </div>

            <div className={'flex flex-col gap-1'}>
              <p className={'text-sm font-medium'}>
                {t('settings.avatar.title')}
              </p>

              <p className={'text-xs text-muted-foreground'}>
                {t('settings.avatar.description')}
              </p>

              {formData.avatarUrl && (
                <button
                  disabled={isUploadingAvatar}
                  onClick={handleAvatarRemove}
                  type={'button'}
                  className={
                    'text-xs text-destructive hover:underline mt-1 w-fit disabled:opacity-50'
                  }
                >
                  {t('settings.avatar.remove')}
                </button>
              )}
            </div>
          </div>

          <Separator />

          <div className={'space-y-2'}>
            <Label htmlFor={'name'}>{t('settings.fields.name')}</Label>

            <Input
              id={'name'}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder={t('settings.fields.namePlaceholder')}
              value={formData.name}
            />
          </div>

          <div className={'space-y-3'}>
            <Label>{t('settings.fields.sex')}</Label>

            <RadioGroup
              className={'flex gap-4'}
              onValueChange={(value) => handleChange('sex', value)}
              value={formData.sex}
            >
              <div className={'flex items-center space-x-2'}>
                <RadioGroupItem id={'sex-male'} value={'male'} />

                <Label
                  className={'font-normal cursor-pointer'}
                  htmlFor={'sex-male'}
                >
                  {t('settings.fields.male')}
                </Label>
              </div>

              <div className={'flex items-center space-x-2'}>
                <RadioGroupItem id={'sex-female'} value={'female'} />

                <Label
                  className={'font-normal cursor-pointer'}
                  htmlFor={'sex-female'}
                >
                  {t('settings.fields.female')}
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className={'grid gap-4 sm:grid-cols-2'}>
            <div className={'space-y-2'}>
              <Label htmlFor={'age'}>{t('settings.fields.age')}</Label>

              <Input
                id={'age'}
                max={'150'}
                min={'1'}
                onChange={(e) => handleChange('age', e.target.value)}
                placeholder={t('settings.fields.agePlaceholder')}
                type={'number'}
                value={formData.age}
              />
            </div>

            <div className={'space-y-2'}>
              <Label htmlFor={'height'}>{t('settings.fields.height')}</Label>

              <Input
                id={'height'}
                max={'300'}
                min={'50'}
                onChange={(e) => handleChange('height', e.target.value)}
                placeholder={t('settings.fields.heightPlaceholder')}
                type={'number'}
                value={formData.height}
              />
            </div>
          </div>

          <div className={'pt-4'}>
            <Button disabled={!hasChanges} onClick={handleSave}>
              <Save className={'mr-2 h-4 w-4'} />

              {t('settings.saveChanges')}
            </Button>
          </div>
        </CardContent>
      </Card>

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

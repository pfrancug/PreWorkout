import type { UserSettings } from '../../contexts/SettingsContext';
import type { ChangeEvent } from 'react';

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
import { Camera, Loader2, Save } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useAuth } from '../../contexts/useAuth';
import { useSettings } from '../../contexts/useSettings';
import { cropToSquareDataUrl } from '../../lib/image';

export const ProfileSettingsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { settings, saveSettings } = useSettings();
  const [formData, setFormData] = useState<UserSettings>(settings);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
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

  const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
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

  return (
    <div
      className={
        'mx-auto w-full max-w-3xl flex flex-1 flex-col gap-4 p-4 lg:gap-8 lg:p-6'
      }
    >
      <div className={'space-y-1'}>
        <h1 className={'text-3xl font-bold tracking-tight'}>
          {t('settings.profile.pageTitle')}
        </h1>

        <p className={'text-muted-foreground'}>
          {t('settings.profile.pageDescription')}
        </p>
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
              placeholder={t('settings.fields.namePlaceholder')}
              value={formData.name}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleChange('name', e.target.value)
              }
            />
          </div>

          <div className={'space-y-3'}>
            <Label>{t('settings.fields.sex')}</Label>

            <RadioGroup
              className={'flex gap-4'}
              onValueChange={(value: string) => handleChange('sex', value)}
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
                placeholder={t('settings.fields.agePlaceholder')}
                type={'number'}
                value={formData.age}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  handleChange('age', e.target.value)
                }
              />
            </div>

            <div className={'space-y-2'}>
              <Label htmlFor={'height'}>{t('settings.fields.height')}</Label>

              <Input
                id={'height'}
                max={'300'}
                min={'50'}
                placeholder={t('settings.fields.heightPlaceholder')}
                type={'number'}
                value={formData.height}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  handleChange('height', e.target.value)
                }
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
    </div>
  );
};

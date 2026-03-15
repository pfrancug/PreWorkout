import type { ActivityIconId } from '@constants/activities';
import type { IActivityCategory } from '@firebase-config/database';

import { ActivityIcon } from '@components/ActivityIcon';
import { IconColorPicker } from '@components/IconColorPicker';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@components/ui/card';
import { Input } from '@components/ui/input';
import {
  ACTIVITY_COLOR_MAP,
  ACTIVITY_COLORS,
  DEFAULT_CATEGORIES,
} from '@constants/activities';
import { useAuth } from '@contexts/useAuth';
import {
  loadCalendarEntries,
  saveActivityCategories,
  subscribeToActivityCategories,
  subscribeToTraineeConnection,
} from '@firebase-config/database';
import {
  Archive,
  ArchiveRestore,
  Check,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export const CategoriesSettingsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [categories, setCategories] = useState<IActivityCategory[]>([]);
  const [usedActivityIds, setUsedActivityIds] = useState<Set<string>>(
    new Set(),
  );
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState<ActivityIconId>('dumbbell');
  const [newColor, setNewColor] = useState(ACTIVITY_COLORS[0].id);

  const [activeTrainerId, setActiveTrainerId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState<ActivityIconId>('dumbbell');
  const [editColor, setEditColor] = useState(ACTIVITY_COLORS[0].id);

  useEffect(() => {
    if (!user) {
      return;
    }

    const unsub = subscribeToActivityCategories(
      user.uid,
      setCategories,
      DEFAULT_CATEGORIES,
    );

    // Load calendar entries to determine which categories are in use
    loadCalendarEntries(user.uid).then((entries) => {
      if (!entries) {
        return;
      }

      const used = new Set<string>();
      for (const dateEntries of Object.values(entries)) {
        for (const entry of Object.values(dateEntries)) {
          if (entry.type === 'activity' && entry.activityId) {
            used.add(entry.activityId);
          }
        }
      }
      setUsedActivityIds(used);
    });

    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const unsub = subscribeToTraineeConnection(user.uid, (conn) => {
      setActiveTrainerId(conn?.trainerId ?? null);
    });

    return unsub;
  }, [user]);

  const handleAdd = async () => {
    if (!user || !newName.trim()) {
      return;
    }

    const id = crypto.randomUUID();

    const updated = [
      ...categories,
      {
        id,
        icon: newIcon,
        name: newName.trim(),
        color: newColor,
      },
    ];

    try {
      await saveActivityCategories(user.uid, updated);
      setNewName('');
      setNewIcon('dumbbell');
      setNewColor(ACTIVITY_COLORS[0].id);
      toast.success(t('settings.categories.addSuccess'));
    } catch {
      toast.error(t('common.saveError'));
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!user) {
      return;
    }

    if (usedActivityIds.has(categoryId)) {
      toast.error(t('settings.categories.inUseError'));

      return;
    }

    const updated = categories.filter((c) => c.id !== categoryId);
    try {
      await saveActivityCategories(user.uid, updated);
      toast.success(t('settings.categories.deleteSuccess'));
    } catch {
      toast.error(t('common.saveError'));
    }
  };

  const startEdit = (category: IActivityCategory) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditIcon(category.icon as ActivityIconId);
    setEditColor(category.color);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async () => {
    if (!user || !editingId || !editName.trim()) {
      return;
    }

    const updated = categories.map((c) =>
      c.id === editingId
        ? { ...c, name: editName.trim(), icon: editIcon, color: editColor }
        : c,
    );

    try {
      await saveActivityCategories(user.uid, updated);
      setEditingId(null);
      toast.success(t('settings.categories.editSuccess'));
    } catch {
      toast.error(t('common.saveError'));
    }
  };

  const handleArchive = async (categoryId: string) => {
    if (!user) {
      return;
    }

    const updated = categories.map((c) =>
      c.id === categoryId ? { ...c, archived: true } : c,
    );

    try {
      await saveActivityCategories(user.uid, updated);
      toast.success(t('settings.categories.archiveSuccess'));
    } catch {
      toast.error(t('common.saveError'));
    }
  };

  const handleUnarchive = async (categoryId: string) => {
    if (!user) {
      return;
    }

    const updated = categories.map((c) => {
      if (c.id !== categoryId) {
        return c;
      }
      const copy = { ...c };
      delete copy.archived;

      return copy;
    });

    try {
      await saveActivityCategories(user.uid, updated);
      toast.success(t('settings.categories.unarchiveSuccess'));
    } catch {
      toast.error(t('common.saveError'));
    }
  };

  const activeCategories = useMemo(
    () => categories.filter((c) => !c.archived),
    [categories],
  );

  const archivedCategories = useMemo(
    () => categories.filter((c) => c.archived),
    [categories],
  );

  return (
    <div
      className={
        'mx-auto w-full max-w-3xl flex flex-1 flex-col gap-4 p-4 lg:gap-8 lg:p-6'
      }
    >
      <div className={'space-y-1'}>
        <h1 className={'text-3xl font-bold tracking-tight'}>
          {t('settings.categories.pageTitle')}
        </h1>

        <p className={'text-muted-foreground'}>
          {t('settings.categories.pageDescription')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.categories.title')}</CardTitle>

          <CardDescription>
            {t('settings.categories.description')}
          </CardDescription>
        </CardHeader>

        <CardContent className={'space-y-4'}>
          {/* Active categories */}
          <div className={'space-y-2'}>
            {activeCategories.map((category) => {
              const isUsed = usedActivityIds.has(category.id);
              const isEditing = editingId === category.id;

              if (isEditing) {
                return (
                  <div
                    key={category.id}
                    className={
                      'flex items-center gap-3 rounded-lg border border-primary/50 bg-accent/30 p-3'
                    }
                  >
                    <IconColorPicker
                      color={editColor}
                      icon={editIcon}
                      onColorChange={setEditColor}
                      onIconChange={setEditIcon}
                    />

                    <Input
                      className={'flex-1'}
                      onChange={(e) => setEditName(e.target.value)}
                      value={editName}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          saveEdit();
                        } else if (e.key === 'Escape') {
                          cancelEdit();
                        }
                      }}
                    />

                    <Button
                      disabled={!editName.trim()}
                      onClick={saveEdit}
                      size={'icon'}
                      variant={'ghost'}
                      className={
                        'h-8 w-8 text-muted-foreground hover:text-primary'
                      }
                    >
                      <Check className={'h-4 w-4'} />
                    </Button>

                    <Button
                      className={'h-8 w-8 text-muted-foreground'}
                      onClick={cancelEdit}
                      size={'icon'}
                      variant={'ghost'}
                    >
                      <X className={'h-4 w-4'} />
                    </Button>
                  </div>
                );
              }

              return (
                <div
                  key={category.id}
                  className={
                    'flex items-center gap-3 rounded-lg border border-border p-3'
                  }
                >
                  <div
                    className={
                      'flex h-9 w-9 items-center justify-center rounded-lg'
                    }
                  >
                    <ActivityIcon
                      className={'h-5 w-5'}
                      iconId={category.icon}
                      style={{ color: ACTIVITY_COLOR_MAP[category.color] }}
                    />
                  </div>

                  <span className={'flex-1 text-sm font-medium'}>
                    {category.name}
                  </span>

                  {category.trainerId && (
                    <Badge
                      title={t('settings.categories.trainerCategoryTooltip')}
                      variant={'secondary'}
                    >
                      {t('settings.categories.trainerBadge')}
                    </Badge>
                  )}

                  <Button
                    onClick={() => startEdit(category)}
                    size={'icon'}
                    title={t('settings.categories.editTooltip')}
                    variant={'ghost'}
                    className={
                      'h-8 w-8 text-muted-foreground hover:text-primary'
                    }
                  >
                    <Pencil className={'h-4 w-4'} />
                  </Button>

                  <Button
                    onClick={() => handleArchive(category.id)}
                    size={'icon'}
                    variant={'ghost'}
                    className={
                      'h-8 w-8 text-muted-foreground hover:text-yellow-600'
                    }
                    disabled={
                      !!category.trainerId &&
                      category.trainerId === activeTrainerId
                    }
                    title={
                      category.trainerId &&
                      category.trainerId === activeTrainerId
                        ? t('settings.categories.activeTrainerTooltip')
                        : t('settings.categories.archiveTooltip')
                    }
                  >
                    <Archive className={'h-4 w-4'} />
                  </Button>

                  <Button
                    disabled={isUsed || !!category.systemGenerated}
                    onClick={() => handleDelete(category.id)}
                    size={'icon'}
                    variant={'ghost'}
                    className={
                      'h-8 w-8 text-muted-foreground hover:text-destructive'
                    }
                    title={
                      isUsed
                        ? t('settings.categories.inUseTooltip')
                        : t('settings.categories.deleteTooltip')
                    }
                  >
                    <Trash2 className={'h-4 w-4'} />
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Add new category */}
          <div
            className={
              'flex items-center gap-3 rounded-lg border border-dashed border-border p-3'
            }
          >
            <IconColorPicker
              color={newColor}
              icon={newIcon}
              onColorChange={setNewColor}
              onIconChange={setNewIcon}
            />

            <Input
              className={'flex-1'}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t('settings.categories.namePlaceholder')}
              value={newName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAdd();
                }
              }}
            />

            <Button
              className={'h-9 w-9 shrink-0'}
              disabled={!newName.trim()}
              onClick={handleAdd}
              size={'icon'}
              variant={'outline'}
            >
              <Plus className={'h-4 w-4'} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Archived categories */}
      {archivedCategories.length > 0 && (
        <Card className={'border-dashed'}>
          <CardHeader>
            <CardTitle className={'flex items-center gap-2'}>
              <Archive className={'h-5 w-5 text-muted-foreground'} />
              {t('settings.categories.archivedTitle')}
            </CardTitle>

            <CardDescription>
              {t('settings.categories.archivedDescription')}
            </CardDescription>
          </CardHeader>

          <CardContent className={'space-y-2'}>
            {archivedCategories.map((category) => {
              const isUsed = usedActivityIds.has(category.id);

              return (
                <div
                  key={category.id}
                  className={
                    'flex items-center gap-3 rounded-lg border border-border/50 p-3 opacity-60'
                  }
                >
                  <div
                    className={
                      'flex h-9 w-9 items-center justify-center rounded-lg'
                    }
                  >
                    <ActivityIcon
                      className={'h-5 w-5'}
                      iconId={category.icon}
                      style={{ color: ACTIVITY_COLOR_MAP[category.color] }}
                    />
                  </div>

                  <span className={'flex-1 text-sm font-medium'}>
                    {category.name}
                  </span>

                  <Badge variant={'outline'}>
                    {t('settings.categories.archivedBadge')}
                  </Badge>

                  {category.trainerId && (
                    <Badge
                      title={t('settings.categories.trainerCategoryTooltip')}
                      variant={'secondary'}
                    >
                      {t('settings.categories.trainerBadge')}
                    </Badge>
                  )}

                  <Button
                    onClick={() => handleUnarchive(category.id)}
                    size={'icon'}
                    title={t('settings.categories.unarchiveTooltip')}
                    variant={'ghost'}
                    className={
                      'h-8 w-8 text-muted-foreground hover:text-primary'
                    }
                  >
                    <ArchiveRestore className={'h-4 w-4'} />
                  </Button>

                  <Button
                    disabled={isUsed || !!category.systemGenerated}
                    onClick={() => handleDelete(category.id)}
                    size={'icon'}
                    variant={'ghost'}
                    className={
                      'h-8 w-8 text-muted-foreground hover:text-destructive'
                    }
                    title={
                      isUsed
                        ? t('settings.categories.inUseTooltip')
                        : t('settings.categories.deleteTooltip')
                    }
                  >
                    <Trash2 className={'h-4 w-4'} />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

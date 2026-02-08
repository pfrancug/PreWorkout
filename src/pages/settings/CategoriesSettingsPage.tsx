import type { ActivityIconId } from '../../constants/activities';
import type { ActivityCategory } from '../../firebase/database';

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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@components/ui/popover';
import { cn } from '@lib/utils';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { ActivityIcon } from '../../components/ActivityIcon';
import {
  ACTIVITY_COLOR_MAP,
  ACTIVITY_COLORS,
  AVAILABLE_ICONS,
  DEFAULT_CATEGORIES,
} from '../../constants/activities';
import { useAuth } from '../../contexts/useAuth';
import {
  loadCalendarData,
  saveActivityCategories,
  subscribeToActivityCategories,
} from '../../firebase/database';

export const CategoriesSettingsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [categories, setCategories] = useState<ActivityCategory[]>([]);
  const [usedActivityIds, setUsedActivityIds] = useState<Set<string>>(
    new Set(),
  );
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState<ActivityIconId>('dumbbell');
  const [newColor, setNewColor] = useState(ACTIVITY_COLORS[0].id);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState<ActivityIconId>('dumbbell');
  const [editColor, setEditColor] = useState(ACTIVITY_COLORS[0].id);
  const [editPickerOpen, setEditPickerOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    const unsub = subscribeToActivityCategories(
      user.uid,
      setCategories,
      DEFAULT_CATEGORIES,
    );

    // Load calendar data to determine which categories are in use
    loadCalendarData(user.uid).then((calendarData) => {
      if (!calendarData) {
        return;
      }

      const used = new Set<string>();
      for (const activities of Object.values(calendarData)) {
        for (const activity of activities) {
          used.add(activity);
        }
      }
      setUsedActivityIds(used);
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

    await saveActivityCategories(user.uid, updated);
    setNewName('');
    setNewIcon('dumbbell');
    setNewColor(ACTIVITY_COLORS[0].id);
    toast.success(t('settings.categories.addSuccess'));
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
    await saveActivityCategories(user.uid, updated);
    toast.success(t('settings.categories.deleteSuccess'));
  };

  const startEdit = (category: ActivityCategory) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditIcon(category.icon as ActivityIconId);
    setEditColor(category.color);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditPickerOpen(false);
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

    await saveActivityCategories(user.uid, updated);
    setEditingId(null);
    setEditPickerOpen(false);
    toast.success(t('settings.categories.editSuccess'));
  };

  return (
    <div className={'mx-auto w-full max-w-3xl flex flex-1 flex-col gap-8 p-6'}>
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
          {/* Existing categories */}
          <div className={'space-y-2'}>
            {categories.map((category) => {
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
                    <Popover
                      onOpenChange={setEditPickerOpen}
                      open={editPickerOpen}
                    >
                      <PopoverTrigger asChild>
                        <button
                          type={'button'}
                          className={
                            'flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-border bg-card transition-colors hover:bg-accent'
                          }
                        >
                          <ActivityIcon
                            className={'h-5 w-5'}
                            iconId={editIcon}
                            style={{
                              color: ACTIVITY_COLOR_MAP[editColor],
                            }}
                          />
                        </button>
                      </PopoverTrigger>

                      <PopoverContent align={'start'} className={'w-auto p-3'}>
                        <p
                          className={
                            'mb-2 text-xs font-medium text-muted-foreground'
                          }
                        >
                          {t('settings.categories.pickColor')}
                        </p>

                        <div className={'mb-3 grid grid-cols-5 gap-2'}>
                          {ACTIVITY_COLORS.map(({ id, hex }) => (
                            <button
                              key={id}
                              onClick={() => setEditColor(id)}
                              type={'button'}
                              className={cn(
                                'flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border transition-colors hover:bg-accent',
                                editColor === id
                                  ? 'border-primary bg-primary/10'
                                  : 'border-border',
                              )}
                            >
                              <span
                                className={'h-5 w-5 rounded-sm'}
                                style={{ backgroundColor: hex }}
                              />
                            </button>
                          ))}
                        </div>

                        <p
                          className={
                            'mb-2 text-xs font-medium text-muted-foreground'
                          }
                        >
                          {t('settings.categories.pickIcon')}
                        </p>

                        <div className={'grid grid-cols-5 gap-2'}>
                          {AVAILABLE_ICONS.map(({ id, icon: Icon, label }) => (
                            <button
                              key={id}
                              title={label}
                              type={'button'}
                              className={cn(
                                'flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border transition-colors hover:bg-accent',
                                editIcon === id
                                  ? 'border-primary bg-primary/10'
                                  : 'border-border',
                              )}
                              onClick={() => {
                                setEditIcon(id);
                                setEditPickerOpen(false);
                              }}
                            >
                              <Icon
                                className={'h-5 w-5'}
                                style={{
                                  color: ACTIVITY_COLOR_MAP[editColor],
                                }}
                              />
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>

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
                    disabled={isUsed}
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
            <Popover onOpenChange={setIconPickerOpen} open={iconPickerOpen}>
              <PopoverTrigger asChild>
                <button
                  type={'button'}
                  className={
                    'flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-border bg-card transition-colors hover:bg-accent'
                  }
                >
                  <ActivityIcon
                    className={'h-5 w-5'}
                    iconId={newIcon}
                    style={{ color: ACTIVITY_COLOR_MAP[newColor] }}
                  />
                </button>
              </PopoverTrigger>

              <PopoverContent align={'start'} className={'w-auto p-3'}>
                <p className={'mb-2 text-xs font-medium text-muted-foreground'}>
                  {t('settings.categories.pickColor')}
                </p>

                <div className={'mb-3 grid grid-cols-5 gap-2'}>
                  {ACTIVITY_COLORS.map(({ id, hex }) => (
                    <button
                      key={id}
                      onClick={() => setNewColor(id)}
                      type={'button'}
                      className={cn(
                        'flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border transition-colors hover:bg-accent',
                        newColor === id
                          ? 'border-primary bg-primary/10'
                          : 'border-border',
                      )}
                    >
                      <span
                        className={'h-5 w-5 rounded-sm'}
                        style={{ backgroundColor: hex }}
                      />
                    </button>
                  ))}
                </div>

                <p className={'mb-2 text-xs font-medium text-muted-foreground'}>
                  {t('settings.categories.pickIcon')}
                </p>

                <div className={'grid grid-cols-5 gap-2'}>
                  {AVAILABLE_ICONS.map(({ id, icon: Icon, label }) => (
                    <button
                      key={id}
                      title={label}
                      type={'button'}
                      className={cn(
                        'flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border transition-colors hover:bg-accent',
                        newIcon === id
                          ? 'border-primary bg-primary/10'
                          : 'border-border',
                      )}
                      onClick={() => {
                        setNewIcon(id);
                        setIconPickerOpen(false);
                      }}
                    >
                      <Icon
                        className={'h-5 w-5'}
                        style={{ color: ACTIVITY_COLOR_MAP[newColor] }}
                      />
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

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
    </div>
  );
};

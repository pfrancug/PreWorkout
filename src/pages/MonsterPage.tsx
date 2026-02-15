import { CandyOff, Plus, Trash2 } from 'lucide-react';
import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  getMonsterById,
  MONSTER_ENERGY,
  MONSTER_JUICED,
  MONSTER_ULTRA,
  type MonsterDrink,
} from '../constants/monster';
import { useAuth } from '../contexts/useAuth';
import { useSettings } from '../contexts/useSettings';
import {
  addEnergyDrink,
  type EnergyDrinksData,
  removeEnergyDrink,
  subscribeToEnergyDrinks,
} from '../firebase/database';

const MonsterCard = ({
  drink,
  onAdd,
}: {
  drink: MonsterDrink;
  onAdd: (drinkId: string) => void;
}) => {
  const { id, name, color } = drink;

  return (
    <div
      className={'w-full rounded-lg p-[1px] cursor-pointer group'}
      onClick={() => onAdd(id)}
      style={{
        background: `linear-gradient(135deg, ${color} 0%, #09090b 15%, #09090b 85%, ${color} 100%)`,
      }}
    >
      <div
        className={
          'flex items-center justify-center rounded-lg p-4 w-full bg-zinc-950 relative min-h-[100px]'
        }
      >
        <div
          className={
            'absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center z-10'
          }
        >
          <Plus className={'w-8 h-8 text-white'} />
        </div>
        <span
          className={'text-center text-sm font-medium drop-shadow-md'}
          style={{ color }}
        >
          {name}
        </span>
        {!drink.sugar && (
          <CandyOff
            className={'absolute top-2 right-2 w-4 h-4 text-zinc-500'}
          />
        )}
      </div>
    </div>
  );
};

const MonsterSection = ({
  title,
  items,
  onAdd,
}: {
  title: string;
  items: MonsterDrink[];
  onAdd: (drinkId: string) => void;
}) => {
  return (
    <div className={'space-y-3'}>
      <h2 className={'text-xl font-semibold'}>{title}</h2>
      <div className={'grid grid-cols-2 lg:grid-cols-3 gap-4'}>
        {items.map((drink) => (
          <MonsterCard drink={drink} key={drink.id} onAdd={onAdd} />
        ))}
      </div>
    </div>
  );
};

const DrinkHistoryItem = ({
  drink,
  date,
  index,
  onRemove,
}: {
  drink: MonsterDrink;
  date: string;
  index: number;
  onRemove: (date: string, index: number) => void;
}) => {
  return (
    <div
      className={
        'flex items-center gap-3 p-2 rounded-lg bg-zinc-900 border border-zinc-800'
      }
    >
      <div
        className={'w-3 h-3 rounded-full shrink-0'}
        style={{ backgroundColor: drink.color }}
      />
      <div className={'flex-1 min-w-0'}>
        <p
          className={'text-sm font-medium truncate'}
          style={{ color: drink.color }}
        >
          {drink.name}
        </p>
        <p className={'text-xs text-muted-foreground'}>{date}</p>
      </div>
      <button
        onClick={() => onRemove(date, index)}
        type={'button'}
        className={
          'p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer'
        }
      >
        <Trash2 className={'w-4 h-4'} />
      </button>
    </div>
  );
};

const DrinkHistory = ({
  drinksData,
  onRemove,
}: {
  drinksData: EnergyDrinksData | null;
  onRemove: (date: string, index: number) => void;
}) => {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');

  const getDateCutoff = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (period === 'day') {
      return now;
    }
    if (period === 'week') {
      now.setDate(now.getDate() - 7);

      return now;
    }
    // month
    now.setDate(now.getDate() - 30);

    return now;
  };

  if (!drinksData || Object.keys(drinksData).length === 0) {
    return (
      <div className={'space-y-3'}>
        <h2 className={'text-xl font-semibold'}>{t('drinks.history')}</h2>
        <p className={'text-muted-foreground text-sm'}>
          {t('drinks.noHistory')}
        </p>
      </div>
    );
  }

  const cutoffDate = getDateCutoff();

  // Sort dates descending (newest first) and filter by cutoff
  const sortedDates = Object.keys(drinksData)
    .filter((dateStr) => new Date(dateStr) >= cutoffDate)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  // Flatten to list with date info
  const allDrinks: {
    drink: MonsterDrink;
    date: string;
    index: number;
  }[] = [];

  for (const date of sortedDates) {
    const drinkIds = drinksData[date];
    if (drinkIds) {
      drinkIds.forEach((drinkId, index) => {
        const drink = getMonsterById(drinkId);
        if (drink) {
          allDrinks.push({ drink, date, index });
        }
      });
    }
  }

  return (
    <div className={'space-y-3'}>
      <div className={'flex items-center justify-between'}>
        <h2 className={'text-xl font-semibold'}>{t('drinks.history')}</h2>
        <Select
          onValueChange={(v) => setPeriod(v as typeof period)}
          value={period}
        >
          <SelectTrigger className={'w-[140px]'}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={'day'}>{t('drinks.periodDay')}</SelectItem>
            <SelectItem value={'week'}>{t('drinks.periodWeek')}</SelectItem>
            <SelectItem value={'month'}>{t('drinks.periodMonth')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {allDrinks.length === 0 ? (
        <p className={'text-muted-foreground text-sm'}>
          {t('drinks.noHistoryPeriod')}
        </p>
      ) : (
        <div className={'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'}>
          {allDrinks.map(({ drink, date, index }) => (
            <DrinkHistoryItem
              date={date}
              drink={drink}
              index={index}
              key={`${date}-${index}`}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const DrinkHeatmap = ({
  drinksData,
}: {
  drinksData: EnergyDrinksData | null;
}) => {
  const { t } = useTranslation();

  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  // Generate last 365 days
  const today = new Date();
  const days: { date: string; count: number; dayOfWeek: number }[] = [];

  for (let i = 364; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = formatLocalDate(date);
    const count = drinksData?.[dateStr]?.length ?? 0;
    days.push({ date: dateStr, count, dayOfWeek: date.getDay() });
  }

  // Group by weeks (columns)
  const weeks: (typeof days)[] = [];
  let currentWeek: typeof days = [];

  // Pad first week with empty days if needed
  const firstDayOfWeek = days[0].dayOfWeek;
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push({ date: '', count: 0, dayOfWeek: i });
  }

  for (const day of days) {
    currentWeek.push(day);
    if (day.dayOfWeek === 6) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const getColor = (count: number) => {
    if (count === 0) {
      return 'bg-zinc-800';
    }
    if (count === 1) {
      return 'bg-green-900';
    }
    if (count === 2) {
      return 'bg-green-700';
    }
    if (count === 3) {
      return 'bg-green-500';
    }

    return 'bg-green-400';
  };

  const totalDrinks = days.reduce((sum, day) => sum + day.count, 0);

  return (
    <div className={'space-y-3 w-full overflow-hidden'}>
      <div className={'flex items-center justify-between'}>
        <h2 className={'text-xl font-semibold'}>{t('drinks.heatmap')}</h2>
        <span className={'text-sm text-muted-foreground'}>
          {t('drinks.totalDrinks', { count: totalDrinks })}
        </span>
      </div>
      <div className={'overflow-x-auto pb-2'}>
        <div className={'flex gap-[2px] min-w-max'}>
          {weeks.map((week, weekIndex) => (
            <div className={'flex flex-col gap-[2px]'} key={weekIndex}>
              {week.map((day, dayIndex) => (
                <div
                  className={`w-[10px] h-[10px] rounded-sm ${day.date ? getColor(day.count) : 'bg-transparent'}`}
                  key={`${weekIndex}-${dayIndex}`}
                  title={day.date ? `${day.date}: ${day.count} drinks` : ''}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className={'flex items-center gap-2 text-xs text-muted-foreground'}>
        <span>{t('drinks.less')}</span>
        <div className={'flex gap-1'}>
          <div className={'w-[10px] h-[10px] rounded-sm bg-zinc-800'} />
          <div className={'w-[10px] h-[10px] rounded-sm bg-green-900'} />
          <div className={'w-[10px] h-[10px] rounded-sm bg-green-700'} />
          <div className={'w-[10px] h-[10px] rounded-sm bg-green-500'} />
          <div className={'w-[10px] h-[10px] rounded-sm bg-green-400'} />
        </div>
        <span>{t('drinks.more')}</span>
      </div>
    </div>
  );
};

export const MonsterPage = memo(() => {
  const { t } = useTranslation();
  const { preferences } = useSettings();
  const { user } = useAuth();
  const [sectionFilter, setSectionFilter] = useState<
    'all' | 'energy' | 'ultra' | 'juiced'
  >('all');
  const [sugarFilter, setSugarFilter] = useState<'all' | 'sugar' | 'no-sugar'>(
    preferences.drinksSugarFilter || 'all',
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [drinksData, setDrinksData] = useState<EnergyDrinksData | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    const unsubscribe = subscribeToEnergyDrinks(user.uid, (data) => {
      setDrinksData(data);
    });

    return unsubscribe;
  }, [user]);

  const handleAddDrink = async (drinkId: string) => {
    if (!user) {
      return;
    }

    try {
      await addEnergyDrink(user.uid, drinkId);
      const drink = getMonsterById(drinkId);
      toast.success(t('drinks.added', { name: drink?.name }));
    } catch {
      toast.error(t('drinks.addError'));
    }
  };

  const handleRemoveDrink = async (date: string, index: number) => {
    if (!user) {
      return;
    }

    try {
      await removeEnergyDrink(user.uid, date, index);
      toast.success(t('drinks.removed'));
    } catch {
      toast.error(t('drinks.removeError'));
    }
  };

  const filterItems = (items: MonsterDrink[]) => {
    let filtered = [...items];

    if (sugarFilter === 'no-sugar') {
      filtered = filtered.filter((item) => !item.sugar);
    } else if (sugarFilter === 'sugar') {
      filtered = filtered.filter((item) => item.sugar);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(query),
      );
    }

    return filtered;
  };

  const showEnergy = sectionFilter === 'all' || sectionFilter === 'energy';
  const showUltra = sectionFilter === 'all' || sectionFilter === 'ultra';
  const showJuiced = sectionFilter === 'all' || sectionFilter === 'juiced';

  const filteredEnergy = filterItems(MONSTER_ENERGY);
  const filteredUltra = filterItems(MONSTER_ULTRA);
  const filteredJuiced = filterItems(MONSTER_JUICED);

  return (
    <div
      className={
        'mx-auto w-full max-w-3xl flex flex-1 flex-col gap-6 p-4 lg:gap-8 lg:p-6'
      }
    >
      <div className={'space-y-1'}>
        <h1 className={'text-3xl font-bold tracking-tight'}>
          {t('drinks.title')}
        </h1>
        <p className={'text-muted-foreground'}>{t('drinks.description')}</p>
      </div>

      <DrinkHeatmap drinksData={drinksData} />

      <DrinkHistory drinksData={drinksData} onRemove={handleRemoveDrink} />

      <div className={'grid grid-cols-3 gap-4'}>
        <Input
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('drinks.search')}
          type={'text'}
          value={searchQuery}
        />

        <Select
          onValueChange={(v) => setSectionFilter(v as typeof sectionFilter)}
          value={sectionFilter}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('drinks.section')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={'all'}>{t('drinks.filterAll')}</SelectItem>
            <SelectItem value={'energy'}>{'Monster Energy'}</SelectItem>
            <SelectItem value={'ultra'}>{'Monster Ultra'}</SelectItem>
            <SelectItem value={'juiced'}>{'Juiced Monster'}</SelectItem>
          </SelectContent>
        </Select>

        <Select
          onValueChange={(v) => setSugarFilter(v as typeof sugarFilter)}
          value={sugarFilter}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('drinks.sugar')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={'all'}>{t('drinks.filterAll')}</SelectItem>
            <SelectItem value={'sugar'}>{t('drinks.sugarYes')}</SelectItem>
            <SelectItem value={'no-sugar'}>{t('drinks.sugarNo')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {showEnergy && filteredEnergy.length > 0 && (
        <MonsterSection
          items={filteredEnergy}
          onAdd={handleAddDrink}
          title={'Monster Energy'}
        />
      )}

      {showUltra && filteredUltra.length > 0 && (
        <MonsterSection
          items={filteredUltra}
          onAdd={handleAddDrink}
          title={'Monster Ultra'}
        />
      )}

      {showJuiced && filteredJuiced.length > 0 && (
        <MonsterSection
          items={filteredJuiced}
          onAdd={handleAddDrink}
          title={'Juiced Monster'}
        />
      )}
    </div>
  );
});

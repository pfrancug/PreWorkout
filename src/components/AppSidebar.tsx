import { Avatar, AvatarFallback, AvatarImage } from '@components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@components/ui/sidebar';
import { useSidebar } from '@components/ui/sidebar-context';
import {
  BookOpen,
  Calculator,
  CalendarDays,
  ChevronsUpDown,
  Database,
  Dumbbell,
  GlassWater,
  Globe,
  Home,
  LogOut,
  MessageSquare,
  ShieldCheck,
  SlidersHorizontal,
  Tags,
  User,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

import { useAuth } from '../contexts/useAuth';
import { useSettings } from '../contexts/useSettings';
import { logoutUser } from '../firebase/auth';

const menuItems = [
  {
    titleKey: 'nav.dashboard',
    icon: Home,
    path: '/dashboard',
  },
  {
    titleKey: 'nav.diary',
    icon: BookOpen,
    path: '/diary',
  },
  {
    titleKey: 'nav.calendar',
    icon: CalendarDays,
    path: '/calendar',
  },
  {
    titleKey: 'nav.calculator',
    icon: Calculator,
    path: '/calculator',
  },
  {
    titleKey: 'nav.chat',
    icon: MessageSquare,
    path: '/chat',
  },
  {
    titleKey: 'nav.drinks',
    icon: GlassWater,
    path: '/drinks',
  },
];

const settingsItems = [
  {
    titleKey: 'nav.settingsProfile',
    icon: User,
    path: '/settings/profile',
  },
  {
    titleKey: 'nav.settingsCategories',
    icon: Tags,
    path: '/settings/categories',
  },
  {
    titleKey: 'nav.settingsPreferences',
    icon: SlidersHorizontal,
    path: '/settings/preferences',
  },
  {
    titleKey: 'nav.settingsData',
    icon: Database,
    path: '/settings/data',
  },
];

export const AppSidebar = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();
  const { user, isAdmin } = useAuth();
  const { settings, changeLanguage } = useSettings();

  const displayName = settings.name || t('nav.anonymous');
  const email = user?.email || '';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }

    return location.pathname === path;
  };

  const isSettingsActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible={'icon'} variant={'inset'}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size={'lg'}>
              <Link onClick={() => isMobile && setOpenMobile(false)} to={'/'}>
                <div
                  className={
                    'flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-500 to-red-500 text-white'
                  }
                >
                  <Dumbbell className={'size-6'} />
                </div>

                <div className={'grid flex-1 text-left text-sm leading-tight'}>
                  <span className={'truncate font-medium'}>
                    {t('app.name')}
                  </span>

                  <span className={'truncate text-xs text-muted-foreground'}>
                    {t('app.tagline')}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('nav.tracking')}</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.path)}
                    tooltip={t(item.titleKey)}
                  >
                    <Link
                      onClick={() => isMobile && setOpenMobile(false)}
                      to={item.path}
                    >
                      <item.icon />

                      <span>{t(item.titleKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t('nav.settings')}</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton
                    asChild
                    isActive={isSettingsActive(item.path)}
                    tooltip={t(item.titleKey)}
                  >
                    <Link
                      onClick={() => isMobile && setOpenMobile(false)}
                      to={item.path}
                    >
                      <item.icon />

                      <span>{t(item.titleKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>{t('nav.administration')}</SidebarGroupLabel>

            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === '/admin'}
                    tooltip={t('nav.admin')}
                  >
                    <Link
                      onClick={() => isMobile && setOpenMobile(false)}
                      to={'/admin'}
                    >
                      <ShieldCheck />

                      <span>{t('nav.admin')}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={i18n.language === 'pl' ? 'English' : 'Polski'}
              onClick={() => {
                changeLanguage(i18n.language === 'pl' ? 'en' : 'pl');
              }}
            >
              <Globe />

              <span>{i18n.language === 'pl' ? 'English' : 'Polski'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size={'lg'}
                  className={
                    'data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
                  }
                >
                  <Avatar className={'h-8 w-8 rounded-lg'}>
                    <AvatarImage alt={displayName} src={settings.avatarUrl} />

                    <AvatarFallback className={'rounded-lg'}>
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div
                    className={'grid flex-1 text-left text-sm leading-tight'}
                  >
                    <span className={'truncate font-medium'}>
                      {displayName}
                    </span>

                    <span className={'truncate text-xs text-muted-foreground'}>
                      {email}
                    </span>
                  </div>

                  <ChevronsUpDown className={'ml-auto size-4'} />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align={'end'}
                side={isMobile ? 'bottom' : 'right'}
                sideOffset={4}
                className={
                  'w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg'
                }
              >
                <DropdownMenuLabel className={'p-0 font-normal'}>
                  <div
                    className={
                      'flex items-center gap-2 px-1 py-1.5 text-left text-sm'
                    }
                  >
                    <Avatar className={'h-8 w-8 rounded-lg'}>
                      <AvatarImage alt={displayName} src={settings.avatarUrl} />

                      <AvatarFallback className={'rounded-lg'}>
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div
                      className={'grid flex-1 text-left text-sm leading-tight'}
                    >
                      <span className={'truncate font-medium'}>
                        {displayName}
                      </span>

                      <span
                        className={'truncate text-xs text-muted-foreground'}
                      >
                        {email}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => logoutUser()}>
                  <LogOut />

                  {t('nav.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

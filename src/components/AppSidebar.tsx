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
  useSidebar,
} from '@components/ui/sidebar';
import {
  BookOpen,
  Calculator,
  ChevronsUpDown,
  Dumbbell,
  Home,
  LogOut,
  MessageSquare,
  Settings,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';

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
    titleKey: 'nav.calculator',
    icon: Calculator,
    path: '/calculator',
  },
  {
    titleKey: 'nav.chat',
    icon: MessageSquare,
    path: '/chat',
  },
];

export const AppSidebar = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { isMobile } = useSidebar();
  const { user } = useAuth();
  const { settings } = useSettings();

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

  return (
    <Sidebar collapsible={'icon'} variant={'inset'}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size={'lg'}>
              <Link to={'/'}>
                <div
                  className={
                    'flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-500 to-red-500 text-white'
                  }
                >
                  <Dumbbell className={'size-5'} />
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
          <SidebarGroupLabel>{t('nav.menu')}</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.path)}
                    tooltip={t(item.titleKey)}
                  >
                    <Link to={item.path}>
                      <item.icon />

                      <span>{t(item.titleKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
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

                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings />

                  {t('nav.settings')}
                </DropdownMenuItem>

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

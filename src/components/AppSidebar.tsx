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
import {
  BookOpen,
  Calculator,
  Dumbbell,
  Home,
  LogOut,
  MessageSquare,
  Settings,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

import { logoutUser } from '../firebase/auth';
import { useRightPanel } from './RightPanel';

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
];

export function AppSidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const { toggle: toggleChat } = useRightPanel();

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }

    return location.pathname === path;
  };

  return (
    <Sidebar variant={'inset'}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size={'lg'}>
              <Link to={'/'}>
                <div
                  className={
                    'flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-600 text-white'
                  }
                >
                  <Dumbbell className={'size-4'} />
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
            <SidebarMenuButton onClick={toggleChat} tooltip={t('nav.chat')}>
              <MessageSquare />

              <span>{t('nav.chat')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive('/settings')}
              tooltip={t('nav.settings')}
            >
              <Link to={'/settings'}>
                <Settings />

                <span>{t('nav.settings')}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => logoutUser()}
              tooltip={t('nav.logout')}
            >
              <LogOut />

              <span>{t('nav.logout')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

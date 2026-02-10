"use client";

import {
  Home,
  Inbox,
  Calendar,
  Search,
  Settings,
  User2,
  ChevronUp,
  Plus,
  UserSearch,
  Projector,
  ChevronDown,
  Users,
  Clipboard,
  BanknoteArrowUp,
  MonitorDot,
  SquareChartGantt,
  TextSearch,
  ArrowDownUp,
  Wallet,
  WalletCards,
  NotebookTabs,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
} from "./ui/sidebar";
import Link from "next/link";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";

const items = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Investors",
    url: "/investors",
    icon: Users,
  },
  {
    title: "History",
    url: "/history",
    icon: TextSearch,
  },
  {
    title: "Rekap",
    url: "/rekap",
    icon: Clipboard,
  },
  // {
  //   title: "Deposit",
  //   url: "http://localhost:3000/deposits",
  //   icon: Wallet,
  // },

  {
    title: "Breakdowns",
    url: "/breakdowns",
    icon: SquareChartGantt,
  },
  {
    title: "Invesments",
    url: "invesments",
    icon: BanknoteArrowUp,
  },
  // {
  //   title: "Report",
  //   url: "http://localhost:3000/dana",
  //   icon: NotebookTabs,
  // },

  // {
  //   title: "Cash Flow",
  //   url: "http://localhost:3000/cashflow",
  //   icon: ArrowDownUp,
  // },
];

const months = [
  { name: "Januari", month: 1 },
  { name: "Februari", month: 2 },
  { name: "Maret", month: 3 },
  { name: "April", month: 4 },
  { name: "Mei", month: 5 },
  { name: "Juni", month: 6 },
  { name: "Juli", month: 7 },
  { name: "Agustus", month: 8 },
  { name: "September", month: 9 },
  { name: "Oktober", month: 10 },
  { name: "November", month: 11 },
  { name: "Desember", month: 12 },
];

const AppSidebar = () => {
  const { data: session } = useSession();
  const { resolvedTheme } = useTheme();

  if (!session) {
    return null; // Don't render sidebar if not logged in
  }

  // Filter items based on user role
  const filteredItems = items.filter((item) => {
    if ((session.user as any)?.role === "USER") {
      return item.title === "Dashboard" || item.title === "Breakdowns";
    }
    return true;
  });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/">
                <Image
                  src={resolvedTheme === "dark" ? "/dark.PNG" : "/light.PNG"}
                  alt="logo"
                  width={30}
                  height={29}
                />
                <span>HSI Application</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.title === "Inbox" && (
                    <SidebarMenuBadge>24</SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {/* <SidebarGroup>
          <SidebarGroupLabel>Projects</SidebarGroupLabel>
          <SidebarGroupAction>
            <Plus /> <span className="sr-only">Add Project</span>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/#">
                    <Projector />
                    See All Projects
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/#">
                    <Plus />
                    Add Project
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup> */}
        {/* BREAKDOWN COLLAPSIBLE */}
        {/* <Collapsible className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger>
                <MonitorDot className="mr-2" />
                Breakdown
                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {availableMonths.map((month) => (
                    <SidebarMenuItem key={month.month}>
                      <SidebarMenuButton asChild>
                        <Link
                          href={`http://localhost:3000/breakdowns?month=${month.month}`}
                        >
                          <Calendar className="h-4 w-4" />
                          {month.name}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible> */}
        {/* MANAGEMENT USER COLLAPSIBLE */}
        {session.user?.role === "SUPER_ADMIN" && (
          <Collapsible defaultOpen className="group/collapsible">
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger>
                  Management User
                  <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link href="/users">
                          <UserSearch />
                          See All Users
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link href="/register">
                          <Plus />
                          Add Users
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}
        {/* NESTED */}
        {/* <SidebarGroup>
          <SidebarGroupLabel>Nested Items</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/#">
                    <Projector />
                    See All Projects
                  </Link>
                </SidebarMenuButton>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild>
                      <Link href="/#">
                        <Plus />
                        Add Project
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild>
                      <Link href="/#">
                        <Plus />
                        Add Category
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup> */}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <User2 /> {session.user?.name || "User"}{" "}
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Account</DropdownMenuItem>
                {/* <DropdownMenuItem>Setting</DropdownMenuItem> */}
                <DropdownMenuItem
                  onClick={() =>
                    signOut({ callbackUrl: "https://www.hsi-finance.com" })
                  }
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;

import {
    Box,
    Flex,
    Text,
    Icon,
    VStack,
    Avatar,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Button,
    Collapse,
    Tooltip,
    useColorMode,
    color,
} from "@chakra-ui/react";
import { NavLink } from "react-router-dom";
import {
    Home,
    List,
    LayoutGrid,
    Boxes,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    LucideLogOut,
    Globe,
    SunMoon,
    LogInIcon,
    LogOutIcon,
} from "lucide-react";


import { useAuth } from "../../hooks/useAuth";
import { useAuthStore } from "../../store/authStore";
import { useUIStore } from "../../store/useUIStore";
import { changeLanguage } from "i18next";
import { useTranslation } from "react-i18next";
import LogoutModal from "./LogoutModal";

const links = [
    { label: "Home", to: "/", icon: Home },
    { label: "Categories", to: "/categories", icon: List },
    { label: "Subcategories", to: "/subcategories", icon: LayoutGrid },
    { label: "Minicategories", to: "/minisubcategories", icon: Settings },
    { label: "Products", to: "/products", icon: Boxes },
];


export default function Sidebar({ collapsed }) {
    const { toggleColorMode } = useColorMode()
    const setCollapsed = useUIStore((s) => s.toggleSidebar);
    const { logout } = useAuth();
    const { user } = useAuthStore();
    const { i18n } = useTranslation()
    const selectLanguage = (lang) => {
        changeLanguage(lang);
        localStorage.setItem("lang", lang);
    }

    return (
        <Flex
            position="fixed"
            w={collapsed ? "80px" : "250px"}
            minH="100vh"
            bg="surface"
            color="text"
            direction="column"
            justify="space-between"
            p={3}
            transition="0.25s ease"
            boxShadow="lg"
            left={0}
            top={0}
            zIndex={1000}
        >
            {/* COLLAPSE TOGGLE BUTTON */}
            <Button
                position="absolute"
                right="0px"
                top="15px"
                size="sm"
                borderRadius="full"
                borderRightRadius={0}
                onClick={() => setCollapsed()}
                bg="surface"
                _hover={{ bg: "gray.500", color: "surface" }}
                color={"text"}
            >
                {collapsed ? <ChevronRight /> : <ChevronLeft />}
            </Button>

            {/* TOP LINKS */}
            <VStack align="stretch" spacing={1} mt={10}>
                {links.map((item) => (
                    <NavLink key={item.to} to={item.to} style={{ textDecoration: "none" }}>
                        {({ isActive }) => (
                            <Tooltip label={collapsed ? item.label : ""} placement="right">
                                <Flex
                                    align="center"
                                    gap={3}
                                    p={3}
                                    borderRadius="lg"
                                    bg={isActive ? "secondary" : "transparent"}
                                    _hover={{ bg: "secondary", color: "white" }}
                                    cursor="pointer"
                                    transition="0.2s"
                                    color={isActive ? "white" : "text"}
                                >
                                    <Icon as={item.icon} w={5} h={5} />
                                    {!collapsed && (
                                        <Text fontWeight="medium">{item.label}</Text>
                                    )}
                                </Flex>
                            </Tooltip>
                        )}
                    </NavLink>
                ))}
            </VStack>
            <VStack align="stretch">
                <VStack spacing={1} py={3} align="stretch">
                    {/* Language Switch */}
                    <Menu>
                        <MenuButton
                            color={"text"}
                            borderRadius={"md"}
                            _hover={{ bg: "secondary", color: "white" }}
                        >
                            <Flex
                                align="center"
                                gap={collapsed ? 0 : 2}
                                p={2}
                                borderRadius="md"
                            >
                                <Globe size={20} />
                                {!collapsed && <Text>Language</Text>}
                            </Flex>
                        </MenuButton>
                        <MenuList bg="surface" borderColor="gray.700">
                            <MenuItem color={i18n.language === "uz" ? "green" : "text"} onClick={() => selectLanguage("uz")}>Uzbek</MenuItem>
                            <MenuItem onClick={() => selectLanguage("ru")}>Russian</MenuItem>
                            <MenuItem onClick={() => selectLanguage("en")}>English</MenuItem>
                        </MenuList>
                    </Menu>

                    {/* Theme Switch */}
                    <Flex
                        align="center"
                        gap={collapsed ? 0 : 2}
                        p={2}
                        borderRadius="md"
                        _hover={{ bg: "secondary", color: "white" }}
                        onClick={() => toggleColorMode()}
                        cursor="pointer"
                    >
                        <SunMoon size={20} />
                        {!collapsed && <Text>Theme</Text>}
                    </Flex>
                </VStack>
                {/* BOTTOM USER SECTION */}
                <Menu placement="right">
                    <Tooltip
                        label={collapsed ? user?.full_name : ""}
                        placement="right"
                        openDelay={200}
                    >
                        <Flex alignItems={"center"}>
                            <MenuButton w="100%" cursor={collapsed ? "pointer" :"default"}>
                                <Flex
                                    align="center"
                                    gap={3}
                                    p={3}
                                    borderRadius="lg"
                                    _hover={{ bg: "gray.700" }}
                                    transition="0.2s"
                                >
                                    <Avatar
                                        name={user?.full_name}
                                        size="sm"
                                        bg="blue.500"
                                        color="white"
                                    />

                                    {!collapsed && (
                                        <Flex width={"100%"} alignItems={"center"} justifyContent={"space-between"}>
                                            <Box>
                                                <Text fontSize="sm" fontWeight="bold" lineHeight={1} >
                                                    {user?.full_name}
                                                </Text>
                                                <Text fontSize="xs" color="gray.400">
                                                    {user?.role}
                                                </Text>
                                            </Box>
                                        </Flex>
                                    )}
                                </Flex>
                            </MenuButton>
                            {!collapsed ?
                                <LogoutModal/>
                                : <noscript></noscript>
                            }
                        </Flex>
                    </Tooltip>

                    {/* HOVER MENU */}
                    {collapsed ?
                        <MenuList bg="surface" borderColor="border">
                            <MenuItem
                                icon={<LucideLogOut />}
                                bg="surface"
                                _hover={{ bg: "red.300", color:"red"}}
                                onClick={logout}
                            >
                                Logout
                            </MenuItem>
                        </MenuList>
                        : <noscript></noscript>
                    }
                </Menu>
            </VStack>

        </Flex>
    );
}

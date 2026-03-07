import { LucideLogOut, Menu as MenuIcon, SunMoon, User } from "lucide-react";
import { Box, Flex, Icon, useColorMode, Menu, MenuButton, Avatar, MenuList, MenuItem, Text, useDisclosure, Button } from "@chakra-ui/react";
import { useAuthStore } from "../../store/authStore";
import LogoutModal from "./LogoutModal";
import { useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import AppSidebar from "./AppSidebar";

export default function Header({ role, links }) {
    const { toggleColorMode } = useColorMode();
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const { isOpen, onOpen, onClose } = useDisclosure()
    const { logout } = useAuth();

    // FUNCTIONS
    const handleLogout = () => {
        logout()
    };
    return (
        <Flex
            display={{ base: "flex", md: "none" }}
            bg={'surfBlur'}
            backdropFilter={"blur(10px)"}
            position={'fixed'}
            justifyContent={'space-between'}
            alignItems={'center'}
            px={'16px'}
            w={'100vw'}
            h={'48px'}
            zIndex={1000}
        >
            <Box
                p="10px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
            >
                <Icon onClick={onOpen} as={MenuIcon} />
            </Box>
            <Flex>
                <Box
                    align="center"
                    p={2}
                    borderRadius="md"
                    onClick={() => toggleColorMode()}
                    cursor="pointer"
                >
                    <SunMoon size={22} />
                </Box>
                <Menu>
                    <MenuButton>
                        <Avatar boxSize={'32px'} name={user?.full_name} size={'sm'} color={'white'} bg={'blue.500'} />
                    </MenuButton>
                    <MenuList w={'54vw'} maxW={'54vw'} minW={'54vw'} p={1}>
                        <MenuItem px={'12px'} py={'8px'}>
                            <Flex
                                alignItems={'center'} gap={'8px'} fontSize={'small'}
                                onClick={() => {
                                    const path = role === "admin" ? "/account" : role === "seller" ? "/cafe/account" : "/ombor/account"
                                    navigate(path)
                                }}
                            >
                                <Icon as={User} />
                                <Text>Account</Text>
                            </Flex>
                        </MenuItem>
                        <MenuItem px={'12px'} py={'8px'}>
                            <Flex
                                alignItems={'center'} gap={'8px'} color={'red.500'} fontSize={'small'}
                                onClick={handleLogout}
                            >
                                <Icon as={LucideLogOut} color={'red.500'} />
                                <Text fontWeight={600}>Log out</Text>
                            </Flex>
                        </MenuItem>
                    </MenuList>
                </Menu>
            </Flex>

            <AppSidebar isOpen={isOpen} onClose={onClose} links={links} role={role} />
        </Flex>
    )
}
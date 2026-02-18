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
            backdropFilter={"blur(5px)"}
            position={'fixed'}
            justifyContent={'space-between'}
            alignItems={'center'}
            px={'8px'}
            w={'100vw'}
            h={'34px'}
            zIndex={1000}
        >
            <Icon onClick={onOpen} as={MenuIcon} />
            <Flex>
                <Box
                    align="center"
                    p={2}
                    borderRadius="md"
                    onClick={() => toggleColorMode()}
                    cursor="pointer"
                >
                    <SunMoon size={20} />
                </Box>
                <Menu>
                    <MenuButton>
                        <Avatar w={'24px'} h={"24px"} name={user?.full_name} size={'sm'} color={'white'} bg={'blue.500'} />
                    </MenuButton>
                    <MenuList w={'50vw'} maxW={'50vw'} minW={'50vw'} p={1}>
                        <MenuItem p={1}>
                            <Flex
                                alignItems={'center'} gap={'4px'} fontSize={'small'}
                                onClick={() => {
                                    const path = role === "admin" ? "/account" : role === "seller" ? "/cafe/account" : "/ombor/account"
                                    navigate(path)
                                }}
                            >
                                <Icon as={User} />
                                <Text>Account</Text>
                            </Flex>
                        </MenuItem>
                        <MenuItem p={1}>
                            <Flex
                                alignItems={'center'} gap={'4px'} color={'red.500'} fontSize={'small'}
                                onClick={handleLogout}
                            >
                                <Icon as={LucideLogOut} color={'red.500'} />
                                <Text fontWeight={600}>Log out</Text>
                            </Flex>
                        </MenuItem>
                    </MenuList>
                </Menu>
            </Flex>

            <AppSidebar isOpen={isOpen} onClose={onClose} links={links} role={role}/>
        </Flex>
    )
}
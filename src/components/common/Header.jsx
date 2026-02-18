import { LucideLogOut, Menu as MenuIcon, SunMoon, User } from "lucide-react";
import { Box, Flex, Icon, useColorMode, Menu, MenuButton, Avatar, MenuList, MenuItem, Text } from "@chakra-ui/react";
import { useAuthStore } from "../../store/authStore";
import LogoutModal from "./LogoutModal";

export default function Header() {
    const { toggleColorMode } = useColorMode();
    const { user } = useAuthStore();


    return (
        <Flex
            display={{ base: "flex", md: "none" }}
            bg={'surfBlur'}
            backdropFilter={"blur(5px)"}
            position={'fixed'}
            justifyContent={'space-between'}
            alignItems={'center'}
            px={'4px'}
            w={'100vw'}
            h={'32px'}
            zIndex={9999}
        >
            <Icon as={MenuIcon} />
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
                        <MenuItem w={'50vw'}>
                            <Flex alignItems={'center'} gap={'4px'} fontSize={'small'}>
                                <Icon as={User} />
                                <Text>Account</Text>
                            </Flex>
                        </MenuItem>
                        <MenuItem>
                            <Flex alignItems={'center'} gap={'4px'} color={'red.500'} fontSize={'small'}>
                                <Icon as={LucideLogOut} color={'red.500'} />
                                <Text fontWeight={600}>Log out</Text>
                            </Flex>
                        </MenuItem>
                    </MenuList>
                </Menu>
            </Flex>
        </Flex>
    )
}
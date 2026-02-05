import { $api } from "../api/axios";
import { BASE_URL } from "../api/axios";
class apiManagers {
    static All = async () => {
        const response = await $api.get(`${BASE_URL}/user`)
        return response;
    }
    static Add = async (data) => {
        const response = await $api.post(`${BASE_URL}/user`, data, {showSuccessToast:"Foydalanuvchi muvafaqqiyatli yaratildi"})
        return response;
    }
    static Update = async (data, id) => {
        const response = await $api.put(`${BASE_URL}/user/${id}`, data, {showSuccessToast:"Foydalanuvchi muvafaqqiyatli yangilandi"})
        return response;
    }
    static Delete = async (id) => {
        const response = await $api.delete(`${BASE_URL}/user/${id}`, {showSuccessToast:"Foydalanuvchi muvafaqqiyatli o'chirildi"})
        return response;
    }
}

export { apiManagers};
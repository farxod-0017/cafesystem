import { $api } from "../api/axios";
import { BASE_URL } from "../api/axios";
class apiProducts {
    static All = async () => {
        const response = await $api.get(`${BASE_URL}/products`)
        return response;
    }
    static getFilteredProducts = async (locId, search, page, limit) => {
        const response = await $api.get(`${BASE_URL}/products/location?locationId=${locId}&search=${search}&page=${page}&limit=${limit}`);
        return response;
    }
    static Add = async (data) => {
        const response = await $api.post(`${BASE_URL}/products`, data, {showSuccessToast:"Mahsulot yaratildi"})
        return response;
    }
    static Update = async (data, id) => {
        const response = await $api.put(`${BASE_URL}/products/${id}`, data, {showSuccessToast:"Mahsulot yangilandi"})
        return response;
    }
    static Delete = async (id) => {
        const response = await $api.delete(`${BASE_URL}/products/${id}`, {showSuccessToast:"Mahsulot o'chirildi"})
        return response;
    }
}

export { apiProducts };
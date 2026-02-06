import { $api } from "../api/axios";
import { BASE_URL } from "../api/axios";
class apiMenuProducts {
    static All = async () => {
        const response = await $api.get(`${BASE_URL}/menu-products`)
        return response;
    }
    static getFilteredProducts = async (categoryId, search, page, limit) => {
        const response = await $api.get(`${BASE_URL}/menu-products/category?categoryId=${categoryId}&search=${search}&page=${page}&limit=${limit}`);
        return response;
    }
    static Add = async (data) => {
        const response = await $api.post(`${BASE_URL}/menu-products`, data, {showSuccessToast:"Mahsulot yaratildi"})
        return response;
    }
    static Update = async (data, id) => {
        const response = await $api.put(`${BASE_URL}/menu-products/${id}`, data, {showSuccessToast:"Mahsulot yangilandi"})
        return response;
    }
    static Delete = async (id) => {
        const response = await $api.delete(`${BASE_URL}/menu-products/${id}`, {showSuccessToast:"Mahsulot o'chirildi"})
        return response;
    }
}

export { apiMenuProducts };
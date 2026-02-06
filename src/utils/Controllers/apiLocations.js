import { $api } from "../api/axios";
import { BASE_URL } from "../api/axios";
class apiLocations {
    static All = async () => {
        const response = await $api.get(`${BASE_URL}/locations`)
        return response;
    }
    static getWarehouses = async () => {
        const response = await $api.get(`${BASE_URL}/locations/type/warehouse`);
        return response;
    }
    static Add = async (data) => {
        const response = await $api.post(`${BASE_URL}/locations`, data, {showSuccessToast:"Location yaratildi"})
        return response;
    }
    static Update = async (data, id) => {
        const response = await $api.put(`${BASE_URL}/locations/${id}`, data, {showSuccessToast:"Location yangilandi"})
        return response;
    }
    static Delete = async (id) => {
        const response = await $api.delete(`${BASE_URL}/locations/${id}`, {showSuccessToast:"Location o'chirildi"})
        return response;
    }
}

export { apiLocations};
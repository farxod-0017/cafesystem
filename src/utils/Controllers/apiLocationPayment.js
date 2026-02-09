import { $api } from "../api/axios";
import { BASE_URL } from "../api/axios";
class apiLocationPayment {
    static getFilterPayerReceiverIDs = async (payerId, receiverId, page) => {
        const response = await $api.get(`${BASE_URL}/payment-locations/location?payerId=${payerId}&receiverId=${receiverId}&page=${page}&limit=20`)
        return response;
    }
    // static getWarehouses = async () => {
    //     const response = await $api.get(`${BASE_URL}/locations`);
    //     return response;
    // }
    // static getLocalLocationsByType = async (type, locationId) => {
    //     const response = await $api.get(`${BASE_URL}/locations/type/${type}/${locationId}`);
    //     return response;
    // }
    // static getFilteredLocalLocationsByType = async (locationId, type, search, page, limit) => {
    //     const response = await $api.get(`${BASE_URL}/locations/page?locationId=${locationId}&type=${type}&search=${search}&page=${page}&limit=${limit}`);
    //     return response;
    // }
    static Add = async (data) => {
        const response = await $api.post(`${BASE_URL}/payment-locations`, data, {showSuccessToast:"To'lov bajarildi"})
        return response;
    }
    // static Update = async (data, id) => {
    //     const response = await $api.put(`${BASE_URL}/locations/${id}`, data, {showSuccessToast:"Location yangilandi"})
    //     return response;
    // }
    // static Delete = async (id) => {
    //     const response = await $api.delete(`${BASE_URL}/locations/${id}`, {showSuccessToast:"Location o'chirildi"})
    //     return response;
    // }
}

export { apiLocationPayment };
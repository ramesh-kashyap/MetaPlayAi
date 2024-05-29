import connection from "../config/connectDB";
import { format } from "date-fns";

const roiCalculation = async () => {
    try {
        // Fetch all active fund transfers
        const [activeFunds] = await connection.query('SELECT id, user_id, amount FROM fund_transfer WHERE status = "active"');

        for (let fund of activeFunds) {
            const { id: fundId, user_id: userId, amount } = fund;
            const maxRoi = 2 * amount;

            // Calculate total ROI given so far
            const [totalRoiResult] = await connection.query('SELECT SUM(comm) as total_roi_given FROM incomes WHERE fund_id = ?', [fundId]);
            const totalRoiGiven = totalRoiResult[0].total_roi_given || 0;

            if (totalRoiGiven > maxRoi) {
                // Update fund_transfer status to completed
                await connection.query('UPDATE fund_transfer SET status = "completed" WHERE id = ?', [fundId]);
                continue; // Skip to the next fund
            }

            // Calculate ROI
            const roi = 0.0033; // 0.33%
            const roiAmount = roi * amount;

            // Get the latest row from minutes_1 table where status is 1
            const [latestMinutes] = await connection.query('SELECT stage, bet FROM minutes_1 WHERE status = 1 ORDER BY id DESC LIMIT 1');
            if (latestMinutes.length === 0) continue; // Skip if no records found

            const { stage, bet } = latestMinutes[0];

            // Insert data into incomes table
            const remarks = "AI bonus";
            await connection.query(
                'INSERT INTO incomes (user_id, fund_id, stage, bet, comm, amount, remarks, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [userId, fundId, stage, bet, roiAmount, amount, remarks, format(new Date(), 'yyyy-MM-dd HH:mm:ss'), format(new Date(), 'yyyy-MM-dd HH:mm:ss')]
            );

            // Update the user's balance in the users table
            await connection.query('UPDATE users SET win_wallet = win_wallet + ? WHERE id = ?', [roiAmount, userId]);
        }
        console.log("ROI calculation completed successfully.");
    } catch (error) {
        console.error("Error in ROI calculation: ", error);
    }
};






export default roiCalculation;

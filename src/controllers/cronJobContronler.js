import connection from "../config/connectDB";
import winGoController from "./winGoController";
import k5Controller from "./k5Controller";
import k3Controller from "./k3Controller";
import userController from "./userController.js";
import cron from 'node-cron';
import roiCalculation from './roiController.js'; // Import your ROI calculation function

const cronJobGame1p = (io) => {
    cron.schedule('*/1 * * * *', async() => {
        await winGoController.addWinGo(1);
        await winGoController.handlingWinGo1P(1);
        const [winGo1] = await connection.execute('SELECT * FROM `wingo` WHERE `game` = "wingo" ORDER BY `id` DESC LIMIT 2 ', []);
        const data = winGo1; // The new bridge has not yet come to fruition
        io.emit('data-server', { data: data });

        await k5Controller.add5D(1);
        await k5Controller.handling5D(1);
        const [k5D] = await connection.execute('SELECT * FROM 5d WHERE `game` = 1 ORDER BY `id` DESC LIMIT 2 ', []);
        const data2 = k5D; // The new bridge has not yet come to fruition
        io.emit('data-server-5d', { data: data2, 'game': '1' });

        await k3Controller.addK3(1);
        await k3Controller.handlingK3(1);
        const [k3] = await connection.execute('SELECT * FROM k3 WHERE `game` = 1 ORDER BY `id` DESC LIMIT 2 ', []);
        const data3 = k3; // The new bridge has not yet come to fruition
        io.emit('data-server-k3', { data: data3, 'game': '1' });
    });

    cron.schedule('*/3 * * * *', async() => {
        await winGoController.addWinGo(3);
        await winGoController.handlingWinGo1P(3);
        const [winGo1] = await connection.execute('SELECT * FROM `wingo` WHERE `game` = "wingo3" ORDER BY `id` DESC LIMIT 2 ', []);
        const data = winGo1; // The new bridge has not yet come to fruition
        io.emit('data-server', { data: data });

        await k5Controller.add5D(3);
        await k5Controller.handling5D(3);
        const [k5D] = await connection.execute('SELECT * FROM 5d WHERE `game` = 3 ORDER BY `id` DESC LIMIT 2 ', []);
        const data2 = k5D; // The new bridge has not yet come to fruition
        io.emit('data-server-5d', { data: data2, 'game': '3' });

        await k3Controller.addK3(3);
        await k3Controller.handlingK3(3);
        const [k3] = await connection.execute('SELECT * FROM k3 WHERE `game` = 3 ORDER BY `id` DESC LIMIT 2 ', []);
        const data3 = k3; // The new bridge has not yet come to fruition
        io.emit('data-server-k3', { data: data3, 'game': '3' });
    });

    cron.schedule('*/5 * * * *', async() => {
        await winGoController.addWinGo(5);
        await winGoController.handlingWinGo1P(5);
        const [winGo1] = await connection.execute('SELECT * FROM `wingo` WHERE `game` = "wingo5" ORDER BY `id` DESC LIMIT 2 ', []);
        const data = winGo1; // The new bridge has not yet come to fruition
        io.emit('data-server', { data: data });

        await k5Controller.add5D(5);
        await k5Controller.handling5D(5);
        const [k5D] = await connection.execute('SELECT * FROM 5d WHERE `game` = 5 ORDER BY `id` DESC LIMIT 2 ', []);
        const data2 = k5D; // The new bridge has not yet come to fruition
        io.emit('data-server-5d', { data: data2, 'game': '5' });

        await k3Controller.addK3(5);
        await k3Controller.handlingK3(5);
        const [k3] = await connection.execute('SELECT * FROM k3 WHERE `game` = 5 ORDER BY `id` DESC LIMIT 2 ', []);
        const data3 = k3; // The new bridge has not yet come to fruition
        io.emit('data-server-k3', { data: data3, 'game': '5' });
    });

    cron.schedule('*/10 * * * *', async() => {
        await winGoController.addWinGo(10);
        await winGoController.handlingWinGo1P(10);
        const [winGo1] = await connection.execute('SELECT * FROM `wingo` WHERE `game` = "wingo10" ORDER BY `id` DESC LIMIT 2 ', []);
        const data = winGo1; // The new bridge has not yet come to fruition
        io.emit('data-server', { data: data });

        await k5Controller.add5D(10);
        await k5Controller.handling5D(10);
        const [k5D] = await connection.execute('SELECT * FROM 5d WHERE `game` = 10 ORDER BY `id` DESC LIMIT 2 ', []);
        const data2 = k5D; // The new bridge has not yet come to fruition
        io.emit('data-server-5d', { data: data2, 'game': '10' });

        await k3Controller.addK3(10);
        await k3Controller.handlingK3(10);
        const [k3] = await connection.execute('SELECT * FROM k3 WHERE `game` = 10 ORDER BY `id` DESC LIMIT 2 ', []);
        const data3 = k3; // The new bridge has not yet come to fruition
        io.emit('data-server-k3', { data: data3, 'game': '10' });
    });

    cron.schedule('* * 0 * * *', async() => {
        await connection.execute('UPDATE users SET roses_today = ?', [0]);
        await connection.execute('UPDATE point_list SET money = ?', [0]);
    });

    // Schedule the ROI calculation to run every day at midnight
    cron.schedule('0 16 * * *', async() => {
        await roiCalculation();
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });

    cron.schedule('0 8 * * *', async() => {
        await userController.calculateTeamRecharge();
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });

    cron.schedule('0 8 * * *', async () => {
        await userController.calculateDailyEarnings();
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });

    cron.schedule('0 8 1 * *', async () => {
        await monthlyVipBonus();
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });
}

module.exports = {
    cronJobGame1p
};

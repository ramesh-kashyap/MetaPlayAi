import connection from "../config/connectDB";
import jwt from 'jsonwebtoken'
import md5 from "md5";
import e from "express";
require('dotenv').config();


const winGoPage = async (req, res) => {
    return res.render("bet/wingo/win.ejs");
}

const winGoPage3 = async (req, res) => {
    return res.render("bet/wingo/win3.ejs");
}

const winGoPage5 = async (req, res) => {
    return res.render("bet/wingo/win5.ejs");
}

const winGoPage10 = async (req, res) => {
    return res.render("bet/wingo/win10.ejs");
}


const isNumber = (params) => {
    let pattern = /^[0-9]*\d$/;
    return pattern.test(params);
}

function formateT(params) {
    let result = (params < 10) ? "0" + params : params;
    return result;
}

function timerJoin(params = '') {
    let date = '';
    if (params) {
        date = new Date(Number(params));
    } else {
        date = new Date();
    }
    let years = formateT(date.getFullYear());
    let months = formateT(date.getMonth() + 1);
    let days = formateT(date.getDate());

    let hours = formateT(date.getHours());
    let minutes = formateT(date.getMinutes());
    let seconds = formateT(date.getSeconds());
    return years + '-' + months + '-' + days + ' ' + hours + ':' + minutes + ':' + seconds;
}

const rosesPlus = async (auth, money) => {
    const [level] = await connection.query('SELECT * FROM level ');
    let level0 = level[0];

    const [user] = await connection.query('SELECT `phone`, `code`, `invite` FROM users WHERE token = ? AND veri = 1  LIMIT 1 ', [auth]);
    let userInfo = user[0];
    const [f1] = await connection.query('SELECT `phone`, `code`, `invite`, `rank` FROM users WHERE code = ? AND veri = 1  LIMIT 1 ', [userInfo.invite]);
    if (money >= 10) {
        if (f1.length > 0) {
            let infoF1 = f1[0];
            let rosesF1 = (money / 100) * level0.f1;
            await connection.query('UPDATE users SET money = money + ?, roses_f1 = roses_f1 + ?, roses_f = roses_f + ?, roses_today = roses_today + ? WHERE phone = ? ', [rosesF1, rosesF1, rosesF1, rosesF1, infoF1.phone]);
            const [f2] = await connection.query('SELECT `phone`, `code`, `invite`, `rank` FROM users WHERE code = ? AND veri = 1  LIMIT 1 ', [infoF1.invite]);
            if (f2.length > 0) {
                let infoF2 = f2[0];
                let rosesF2 = (money / 100) * level0.f2;
                await connection.query('UPDATE users SET money = money + ?, roses_f = roses_f + ?, roses_today = roses_today + ? WHERE phone = ? ', [rosesF2, rosesF2, rosesF2, infoF2.phone]);
                const [f3] = await connection.query('SELECT `phone`, `code`, `invite`, `rank` FROM users WHERE code = ? AND veri = 1  LIMIT 1 ', [infoF2.invite]);
                if (f3.length > 0) {
                    let infoF3 = f3[0];
                    let rosesF3 = (money / 100) * level0.f3;
                    await connection.query('UPDATE users SET money = money + ?, roses_f = roses_f + ?, roses_today = roses_today + ? WHERE phone = ? ', [rosesF3, rosesF3, rosesF3, infoF3.phone]);
                    const [f4] = await connection.query('SELECT `phone`, `code`, `invite`, `rank` FROM users WHERE code = ? AND veri = 1  LIMIT 1 ', [infoF3.invite]);
                    if (f4.length > 0) {
                        let infoF4 = f4[0];
                        let rosesF4 = (money / 100) * level0.f4;
                        await connection.query('UPDATE users SET money = money + ?, roses_f = roses_f + ?, roses_today = roses_today + ? WHERE phone = ? ', [rosesF4, rosesF4, rosesF4, infoF4.phone]);
                    }
                }
            }

        }
    }
}

const betWinGo = async (req, res) => {
    let { typeid, join, x, money } = req.body;

   
    let auth = req.cookies.auth;

    if (typeid != 1 && typeid != 3 && typeid != 5 && typeid != 10) {
        return res.status(200).json({
            message: 'Error!',
            status: true
        });
    }

    let gameJoin = '';
    if (typeid == 1) gameJoin = 'wingo';
    if (typeid == 3) gameJoin = 'wingo3';
    if (typeid == 5) gameJoin = 'wingo5';
    if (typeid == 10) gameJoin = 'wingo10';
    const [winGoNow] = await connection.query(`SELECT period FROM wingo WHERE status = 0 AND game = '${gameJoin}' ORDER BY id DESC LIMIT 1 `);
    const [user] = await connection.query('SELECT `phone`, `code`, `invite`, `level`, `money` FROM users WHERE token = ? AND veri = 1  LIMIT 1 ', [auth]);
    if (!winGoNow[0] || !user[0] || !isNumber(x) || !isNumber(money)) {
        return res.status(200).json({
            message: 'Error!',
            status: true
        });
    }

    let userInfo = user[0];
    let period = winGoNow[0].period;
    let fee = (x * money) * 0.02;
    let total = (x * money) - fee;
    let timeNow = Date.now();
    let check = userInfo.money - total;

    let date = new Date();
    let years = formateT(date.getFullYear());
    let months = formateT(date.getMonth() + 1);
    let days = formateT(date.getDate());
    let id_product = years + months + days + Math.floor(Math.random() * 1000000000000000);

    let formatTime = timerJoin();

    let color = '';
    if (join == 'l') {
        color = 'big';
    } else if (join == 'n') {
        color = 'small';
    } else if (join == 't') {
        color = 'violet';
    } else if (join == 'd') {
        color = 'red';
    } else if (join == 'x') {
        color = 'green';
    } else if (join == '0') {
        color = 'red-violet';
    } else if (join == '5') {
        color = 'green-violet';
    } else if (join % 2 == 0) {
        color = 'red';
    } else if (join % 2 != 0) {
        color = 'green';
    }

    let checkJoin = '';

    if (!isNumber(join) && join == 'l' || join == 'n') {
        checkJoin = `
        <div data-v-a9660e98="" class="van-image" style="width: 30px; height: 30px;">
            <img src="/images/${(join == 'n') ? 'small' : 'big'}.png" class="van-image__img">
        </div>
        `
    } else {
        checkJoin =
            `
        <span data-v-a9660e98="">${(isNumber(join)) ? join : ''}</span>
        `
    }


    let result = `
    <div data-v-a9660e98="" issuenumber="${period}" addtime="${formatTime}" rowid="1" class="hb">
        <div data-v-a9660e98="" class="item c-row">
            <div data-v-a9660e98="" class="result">
                <div data-v-a9660e98="" class="select select-${(color)}">
                    ${checkJoin}
                </div>
            </div>
            <div data-v-a9660e98="" class="c-row c-row-between info">
                <div data-v-a9660e98="">
                    <div data-v-a9660e98="" class="issueName">
                        ${period}
                    </div>
                    <div data-v-a9660e98="" class="tiem">${formatTime}</div>
                </div>
            </div>
        </div>
        <!---->
    </div>
    `;

    function timerJoin(params = '') {
        let date = '';
        if (params) {
            date = new Date(Number(params));
        } else {
            date = new Date();
        }
        let years = formateT(date.getFullYear());
        let months = formateT(date.getMonth() + 1);
        let days = formateT(date.getDate());
        return years + '-' + months + '-' + days;
    }
    let checkTime = timerJoin(date.getTime());

    if (check >= 0) {
        const sql = `INSERT INTO minutes_1 SET 
        id_product = ?,
        phone = ?,
        code = ?,
        invite = ?,
        stage = ?,
        level = ?,
        money = ?,
        amount = ?,
        fee = ?,
        get = ?,
        game = ?,
        bet = ?,
        status = ?,
        today = ?,
        time = ?`;
        await connection.execute(sql, [id_product, userInfo.phone, userInfo.code, userInfo.invite, period, userInfo.level, total, x, fee, 0, gameJoin, join, 0, checkTime, timeNow]);
        checkVipBonus(userInfo.phone,(money * x)/10);
        await connection.execute('UPDATE `users` SET `money` = `money` - ? WHERE `token` = ? ', [money * x, auth]);
        const [users] = await connection.query('SELECT `money`, `level` FROM users WHERE token = ? AND veri = 1  LIMIT 1 ', [auth]);
        await rosesPlus(auth, money * x);
        const [level] = await connection.query('SELECT * FROM level ');
        let level0 = level[0];
        const sql2 = `INSERT INTO roses SET 
        phone = ?,
        code = ?,
        invite = ?,
        f1 = ?,
        f2 = ?,
        f3 = ?,
        f4 = ?,
        time = ?`;
        let total_m = money * x;
        let f1 = (total_m / 100) * level0.f1;
        let f2 = (total_m / 100) * level0.f2;
        let f3 = (total_m / 100) * level0.f3;
        let f4 = (total_m / 100) * level0.f4;
        await connection.execute(sql2, [userInfo.phone, userInfo.code, userInfo.invite, f1, f2, f3, f4, timeNow]);
        return res.status(200).json({
            message: 'Bet successfully',
            status: true,
            data: result,
            change: users[0].level,
            money: users[0].money,
        });
    } else {
        return res.status(200).json({
            message: 'The amount is not enough',
            status: false
        });
    }
}

const checkVipBonus = async (phone, exp) => {
    try {
        const [user] = await connection.query('SELECT id, experience, vip_level FROM users WHERE phone = ?', [phone]);
        if (!user.length) {
            console.log('User not found');
            return;
        }

        let { id: userId, experience, vip_level } = user[0];
        let newExp = experience + exp;
        let newVipLevel = 0;

        if (newExp > 3000 && newExp < 30000) newVipLevel = 1;
        else if (newExp >= 30000 && newExp < 400000) newVipLevel = 2;
        else if (newExp >= 400000 && newExp < 2000000) newVipLevel = 3;
        else if (newExp >= 2000000 && newExp < 8000000) newVipLevel = 4;
        else if (newExp >= 8000000 && newExp < 30000000) newVipLevel = 5;
        else if (newExp >= 30000000 && newExp < 100000000) newVipLevel = 6;
        else if (newExp >= 100000000 && newExp < 400000000) newVipLevel = 7;
        else if (newExp >= 400000000 && newExp < 1000000000) newVipLevel = 8;
        else if (newExp >= 1000000000 && newExp < 5000000000) newVipLevel = 9;
        else if (newExp >= 5000000000) newVipLevel = 10;

        if (newVipLevel !== vip_level) {
            await connection.query('UPDATE users SET vip_level = ?, experience = ? WHERE phone = ?', [newVipLevel, newExp, phone]);

            const [vipRule] = await connection.query('SELECT level_up_reward FROM vip_rules WHERE vip_level = ?', [newVipLevel]);
            if (vipRule.length) {
                const { level_up_reward } = vipRule[0];
                // await connection.query('UPDATE users SET money = money + ? WHERE phone = ?', [level_up_reward, phone]);

                const sql = `INSERT INTO incomes SET 
                    user_id = ?, 
                    amount = ?, 
                    comm = ?, 
                    remarks = ?, 
                    rname = ?, 
                    created_at = ?, 
                    updated_at = ?`;
                const timeNow = new Date().toISOString();
                await connection.execute(sql, [userId, level_up_reward, level_up_reward, 'Level Up Bonus', 0, timeNow, timeNow]);

                console.log(`VIP level updated to ${newVipLevel} and money rewarded: ${level_up_reward}`);
            }
        } else {
            await connection.query('UPDATE users SET experience = ? WHERE phone = ?', [newExp, phone]);
            console.log('Experience updated without VIP level change');
        }
    } catch (error) {
        console.error('Error in checkVipBonus:', error);
    }
};

const listOrderOld = async (req, res) => {
    let { typeid, pageno, pageto } = req.body;

    if (typeid != 1 && typeid != 3 && typeid != 5 && typeid != 10) {
        return res.status(200).json({
            message: 'Error!',
            status: true
        });
    }
    if (pageno < 0 || pageto < 0) {
        return res.status(200).json({
            code: 0,
            msg: "No more data",
            data: {
                gameslist: [],
            },
            status: false
        });
    }
    let auth = req.cookies.auth;
    const [user] = await connection.query('SELECT `phone`, `code`, `invite`, `level`, `money` FROM users WHERE token = ? AND veri = 1  LIMIT 1 ', [auth]);

    let game = '';
    if (typeid == 1) game = 'wingo';
    if (typeid == 3) game = 'wingo3';
    if (typeid == 5) game = 'wingo5';
    if (typeid == 10) game = 'wingo10';

    const [wingo] = await connection.query(`SELECT * FROM wingo WHERE status != 0 AND game = '${game}' ORDER BY id DESC LIMIT ${pageno}, ${pageto} `);
    const [wingoAll] = await connection.query(`SELECT * FROM wingo WHERE status != 0 AND game = '${game}' `);
    const [period] = await connection.query(`SELECT period FROM wingo WHERE status = 0 AND game = '${game}' ORDER BY id DESC LIMIT 1 `);
    if (!wingo[0]) {
        return res.status(200).json({
            code: 0,
            msg: "no more data",
            data: {
                gameslist: [],
            },
            status: false
        });
    }
    if (!pageno || !pageto || !user[0] || !wingo[0] || !period[0]) {
        return res.status(200).json({
            message: 'Error!',
            status: true
        });
    }
    let page = Math.ceil(wingoAll.length / 10);
    return res.status(200).json({
        code: 0,
        msg: "Get success",
        data: {
            gameslist: wingo,
        },
        period: period[0].period,
        page: page,
        status: true
    });
}

const GetMyEmerdList = async (req, res) => {
    let { typeid, pageno, pageto } = req.body;

    // if (!pageno || !pageto) {
    //     pageno = 0;
    //     pageto = 10;
    // }

    if (typeid != 1 && typeid != 3 && typeid != 5 && typeid != 10) {
        return res.status(200).json({
            message: 'Error!',
            status: true
        });
    }

    if (pageno < 0 || pageto < 0) {
        return res.status(200).json({
            code: 0,
            msg: "No more data",
            data: {
                gameslist: [],
            },
            status: false
        });
    }
    let auth = req.cookies.auth;

    let game = '';
    if (typeid == 1) game = 'wingo';
    if (typeid == 3) game = 'wingo3';
    if (typeid == 5) game = 'wingo5';
    if (typeid == 10) game = 'wingo10';

    const [user] = await connection.query('SELECT `phone`, `code`, `invite`, `level`, `money` FROM users WHERE token = ? AND veri = 1 LIMIT 1 ', [auth]);
    const [minutes_1] = await connection.query(`SELECT * FROM minutes_1 WHERE phone = ? AND game = '${game}' ORDER BY id DESC LIMIT ${Number(pageno) + ',' + Number(pageto)}`, [user[0].phone]);
    const [minutes_1All] = await connection.query(`SELECT * FROM minutes_1 WHERE phone = ? AND game = '${game}' ORDER BY id DESC `, [user[0].phone]);

    if (!minutes_1[0]) {
        return res.status(200).json({
            code: 0,
            msg: "No more data",
            data: {
                gameslist: [],
            },
            status: false
        });
    }
    if (!pageno || !pageto || !user[0] || !minutes_1[0]) {
        return res.status(200).json({
            message: 'Error!',
            status: true
        });
    }
    let page = Math.ceil(minutes_1All.length / 10);

    let datas = minutes_1.map((data) => {
        let { id, phone, code, invite, level, game, ...others } = data;
        return others;
    });

    console.log(datas);

    return res.status(200).json({
        code: 0,
        msg: "Get success",
        data: {
            gameslist: datas,
        },
        page: page,
        status: true
    });
}

const addWinGo = async (game) => {
    try {
        let join = '';
        if (game == 1) join = 'wingo';
        if (game == 3) join = 'wingo3';
        if (game == 5) join = 'wingo5';
        if (game == 10) join = 'wingo10';

        const [winGoNow] = await connection.query(`SELECT period FROM wingo WHERE status = 0 AND game = "${join}" ORDER BY id DESC LIMIT 1 `);
        const [setting] = await connection.query('SELECT * FROM `admin` ');
        let period = winGoNow[0].period; // current demand
        let amount = Math.floor(Math.random() * 10); //blue red purple
        // let amount = 1;
        // console.log("Winning Amt: "+amount);
        let timeNow = Date.now();

        let nextResult = '';
        if (game == 1) nextResult = setting[0].wingo1;
        if (game == 3) nextResult = setting[0].wingo3;
        if (game == 5) nextResult = setting[0].wingo5;
        if (game == 10) nextResult = setting[0].wingo10;

        let newArr = '';
        if (nextResult == '-1') {
            await connection.execute(`UPDATE wingo SET amount = ?,status = ? WHERE period = ? AND game = "${join}"`, [amount, 1, period]);
            newArr = '-1';
        } else {
            let result = '';
            let arr = nextResult.split('|');
            let check = arr.length;
            if (check == 1) {
                newArr = '-1';
            } else {
                for (let i = 1; i < arr.length; i++) {
                    newArr += arr[i] + '|';
                }
                newArr = newArr.slice(0, -1);
            }
            result = arr[0];

            // console.log('new Number '+result);
            await connection.execute(`UPDATE wingo SET amount = ?,status = ? WHERE period = ? AND game = "${join}"`, [result, 1, period]);
        }
          const currentDate = new Date();
        // Extract individual components
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1; // Months are zero-based, so add 1
        const day = currentDate.getDate().toString().padStart(2, "0");
        const todaysDate = year+""+month+""+day;
    
        const newPeriod = Number(Number(period.slice(7))+1);
        const finalPeriod = todaysDate +""+ newPeriod;
        
       const sql = `INSERT INTO wingo SET 
        period = ?,
        amount = ?,
        game = ?,
        status = ?,
        time = ?`;
        await connection.execute(sql, [finalPeriod, 0, join, 0, timeNow]);

        if (game == 1) join = 'wingo1';
        if (game == 3) join = 'wingo3';
        if (game == 5) join = 'wingo5';
        if (game == 10) join = 'wingo10';

        await connection.execute(`UPDATE admin SET ${join} = ?`, [newArr]);
    } catch (error) {
        if (error) {
            console.log(error);
        }
    }
}

const checkPeriodAndStage = async (req, res) => {
    try {
        // Query to select the period for the game "wingo" with status 1
        const [gamePeriodResult] = await connection.query(
            'SELECT period FROM wingo WHERE game = "wingo" AND status = 1 ORDER BY period DESC LIMIT 1'
        );
        
        console.log(gamePeriodResult[0].period);

        if (gamePeriodResult.length === 0) {
            return res.status(200).json({
                message: 'No period found for game wingo with status 1',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }

        const period = gamePeriodResult[0].period;

        // Query to check if the period matches the stage in minutes_1 table
        const [stageResult] = await connection.query(
            'SELECT stage FROM minutes_1 WHERE stage = ?',
            [period]
        );

        if (stageResult.length === 0) {
            return res.status(200).json({
                message: 'No matching stage found in minutes_1 table',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }

        return res.status(200).json({
            message: 'success',
            status: true,
            timeStamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Error checking period and stage:', error);
        return res.status(500).json({
            message: 'Internal Server Error',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }
};


const checkPeriodAndStage3 = async (req, res) => {
    try {
        // Query to select the period for the game "wingo" with status 1
        const [gamePeriodResult] = await connection.query(
            'SELECT period FROM wingo WHERE game = "wingo3" AND status = 1 ORDER BY period DESC LIMIT 1'
        );
        
        console.log(gamePeriodResult[0].period);

        if (gamePeriodResult.length === 0) {
            return res.status(200).json({
                message: 'No period found for game wingo with status 1',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }

        const period = gamePeriodResult[0].period;

        // Query to check if the period matches the stage in minutes_1 table
        const [stageResult] = await connection.query(
            'SELECT stage FROM minutes_1 WHERE stage = ?',
            [period]
        );

        if (stageResult.length === 0) {
            return res.status(200).json({
                message: 'No matching stage found in minutes_1 table',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }

        return res.status(200).json({
            message: 'success',
            status: true,
            timeStamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Error checking period and stage:', error);
        return res.status(500).json({
            message: 'Internal Server Error',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }
};


const checkPeriodAndStage5 = async (req, res) => {
    try {
        // Query to select the period for the game "wingo" with status 1
        const [gamePeriodResult] = await connection.query(
            'SELECT period FROM wingo WHERE game = "wingo5" AND status = 1 ORDER BY period DESC LIMIT 1'
        );
        
        console.log(gamePeriodResult[0].period);

        if (gamePeriodResult.length === 0) {
            return res.status(200).json({
                message: 'No period found for game wingo with status 1',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }

        const period = gamePeriodResult[0].period;

        // Query to check if the period matches the stage in minutes_1 table
        const [stageResult] = await connection.query(
            'SELECT stage FROM minutes_1 WHERE stage = ?',
            [period]
        );

        if (stageResult.length === 0) {
            return res.status(200).json({
                message: 'No matching stage found in minutes_1 table',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }

        return res.status(200).json({
            message: 'success',
            status: true,
            timeStamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Error checking period and stage:', error);
        return res.status(500).json({
            message: 'Internal Server Error',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }
};


const checkPeriodAndStage10 = async (req, res) => {
    try {
        // Query to select the period for the game "wingo" with status 1
        const [gamePeriodResult] = await connection.query(
            'SELECT period FROM wingo WHERE game = "wingo10" AND status = 1 ORDER BY period DESC LIMIT 1'
        );
        
        console.log(gamePeriodResult[0].period);

        if (gamePeriodResult.length === 0) {
            return res.status(200).json({
                message: 'No period found for game wingo with status 1',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }

        const period = gamePeriodResult[0].period;

        // Query to check if the period matches the stage in minutes_1 table
        const [stageResult] = await connection.query(
            'SELECT stage FROM minutes_1 WHERE stage = ?',
            [period]
        );

        if (stageResult.length === 0) {
            return res.status(200).json({
                message: 'No matching stage found in minutes_1 table',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }

        return res.status(200).json({
            message: 'success',
            status: true,
            timeStamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Error checking period and stage:', error);
        return res.status(500).json({
            message: 'Internal Server Error',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }
};









const handlingWinGo1P = async (typeid) => {

    let game = '';
    if (typeid == 1) game = 'wingo';
    if (typeid == 3) game = 'wingo3';
    if (typeid == 5) game = 'wingo5';
    if (typeid == 10) game = 'wingo10';

    const [winGoNow] = await connection.query(`SELECT * FROM wingo WHERE status != 0 AND game = '${game}' ORDER BY id DESC LIMIT 1 `);
    
    // update ket qua
    await connection.execute(`UPDATE minutes_1 SET result = ? WHERE status = 0 AND game = '${game}'`, [winGoNow[0].amount]);
    let result = Number(winGoNow[0].amount);
    switch (result) {
        case 0:
            await connection.execute(`UPDATE minutes_1 SET status = 2 WHERE status = 0 AND game = "${game}" AND bet != "l" AND bet != "n" AND bet != "d" AND bet != "0" AND bet != "t" `, []);
            break;
        case 1:
            await connection.execute(`UPDATE minutes_1 SET status = 2 WHERE status = 0 AND game = "${game}" AND bet != "l" AND bet != "n" AND bet != "x" AND bet != "1" `, []);
            break;
        case 2:
            await connection.execute(`UPDATE minutes_1 SET status = 2 WHERE status = 0 AND game = "${game}" AND bet != "l" AND bet != "n" AND bet != "d" AND bet != "2" `, []);
            break;
        case 3:
            await connection.execute(`UPDATE minutes_1 SET status = 2 WHERE status = 0 AND game = "${game}" AND bet != "l" AND bet != "n" AND bet != "x" AND bet != "3" `, []);
            break;
        case 4:
            await connection.execute(`UPDATE minutes_1 SET status = 2 WHERE status = 0 AND game = "${game}" AND bet != "l" AND bet != "n" AND bet != "d" AND bet != "4" `, []);
            break;
        case 5:
            await connection.execute(`UPDATE minutes_1 SET status = 2 WHERE status = 0 AND game = "${game}" AND bet != "l" AND bet != "n" AND bet != "x" AND bet != "5" AND bet != "t" `, []);
            break;
        case 6:
            await connection.execute(`UPDATE minutes_1 SET status = 2 WHERE status = 0 AND game = "${game}" AND bet != "l" AND bet != "n" AND bet != "d" AND bet != "6" `, []);
            break;
        case 7:
            await connection.execute(`UPDATE minutes_1 SET status = 2 WHERE status = 0 AND game = "${game}" AND bet != "l" AND bet != "n" AND bet != "x" AND bet != "7" `, []);
            break;
        case 8:
            await connection.execute(`UPDATE minutes_1 SET status = 2 WHERE status = 0 AND game = "${game}" AND bet != "l" AND bet != "n" AND bet != "d" AND bet != "8" `, []);
            break;
        case 9:
            await connection.execute(`UPDATE minutes_1 SET status = 2 WHERE status = 0 AND game = "${game}" AND bet != "l" AND bet != "n" AND bet != "x" AND bet != "9" `, []);
            break;
        default:
            break;
    }

    if (result < 5) {
        await connection.execute(`UPDATE minutes_1 SET status = 2 WHERE status = 0 AND game = "${game}" AND bet = "l" `, []);
    } else {
        await connection.execute(`UPDATE minutes_1 SET status = 2 WHERE status = 0 AND game = "${game}" AND bet = "n" `, []);
    }

    // lấy ra danh sách đặt cược chưa xử lý
    const [order] = await connection.execute(`SELECT * FROM minutes_1 WHERE status = 0 AND game = '${game}' `);
    for (let i = 0; i < order.length; i++) {
        let orders = order[i];
        let result = orders.result;
        let bet = orders.bet;
        let total = orders.money;
        let id = orders.id;
        let phone = orders.phone;
        var nhan_duoc = 0;

        if (bet == 'l' || bet == 'n') {
            nhan_duoc = total * 2;
        } else {
            if (result == 0 || result == 5) {
                if (bet == 'd' || bet == 'x') {
                    nhan_duoc = total * 1.5;
                } else if (bet == 't') {
                    nhan_duoc = total * 4.5;
                } else if (bet == "0" || bet == "5") {
                    nhan_duoc = total * 9;
                }
            } else {
                if (result == 1 && bet == "1") {
                    nhan_duoc = total * 9;
                } else {
                    if (result == 1 && bet == 'x') {
                        nhan_duoc = total * 2;
                    }
                }
                if (result == 2 && bet == "2") {
                    nhan_duoc = total * 9;
                } else {
                    if (result == 2 && bet == 'd') {
                        nhan_duoc = total * 2;
                    }
                }
                if (result == 3 && bet == "3") {
                    nhan_duoc = total * 9;
                } else {
                    if (result == 3 && bet == 'x') {
                        nhan_duoc = total * 2;
                    }
                }
                if (result == 4 && bet == "4") {
                    nhan_duoc = total * 9;
                } else {
                    if (result == 4 && bet == 'd') {
                        nhan_duoc = total * 2;
                    }
                }
                if (result == 6 && bet == "6") {
                    nhan_duoc = total * 9;
                } else {
                    if (result == 6 && bet == 'd') {
                        nhan_duoc = total * 2;
                    }
                }
                if (result == 7 && bet == "7") {
                    nhan_duoc = total * 9;
                } else {
                    if (result == 7 && bet == 'x') {
                        nhan_duoc = total * 2;
                    }
                }
                if (result == 8 && bet == "8") {
                    nhan_duoc = total * 9;
                } else {
                    if (result == 8 && bet == 'd') {
                        nhan_duoc = total * 2;
                    }
                }
                if (result == 9 && bet == "9") {
                    nhan_duoc = total * 9;
                } else {
                    if (result == 9 && bet == 'x') {
                        nhan_duoc = total * 2;
                    }
                }
            }
        }
        const [users] = await connection.execute('SELECT `win_wallet` FROM `users` WHERE `phone` = ?', [phone]);
  let win_wallet = parseInt(users[0].win_wallet, 10);
 let totals = win_wallet + nhan_duoc;
  console.log(totals);
  await connection.execute('UPDATE `minutes_1` SET `get` = ?, `status` = 1 WHERE `id` = ? ', [nhan_duoc, id]);
  const sql = 'UPDATE `users` SET `win_wallet` = ? WHERE `phone` = ? ';
 await connection.execute(sql, [totals, phone]);

    }

    
}

module.exports = {
    winGoPage,
    betWinGo,
    listOrderOld,
    GetMyEmerdList,
    handlingWinGo1P,
    addWinGo,
    winGoPage3,
    winGoPage5,
    winGoPage10,
    checkPeriodAndStage,
    checkPeriodAndStage3,
    checkPeriodAndStage5,
    checkPeriodAndStage10
}
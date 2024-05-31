import connection from "../config/connectDB";
import jwt from 'jsonwebtoken'
import md5 from "md5";
import request from 'request';
const Coinpayments = require('coinpayments');
const axios = require('axios');

require('dotenv').config();

let timeNow = Date.now();
const client = new Coinpayments({
    key: '492c48d33d70aa0a7e8d3e14f7cb756a3f7cb4345ce9a97ecd56f01158d4bf81',
    secret: '01F6e742cA7169D6113380D5f74727454f83cd29503AAFb0CBAb5dA7533486df',
  });

const randomNumber = (min, max) => {
    return String(Math.floor(Math.random() * (max - min + 1)) + min);
}
const verifyCode = async(req, res) => {
    let auth = req.cookies.auth;
    let now = new Date().getTime();
    let timeEnd = (+new Date) + 1000 * (60 * 2 + 0) + 500; 
    let otp = randomNumber(100000, 999999);

    const [rows] = await connection.query('SELECT * FROM users WHERE `token` = ? ', [auth]);
    if (!rows) {
        return res.status(200).json({
            message: 'Account does not exist',
            status: false,
            timeStamp: timeNow,
        });
    }
    let user = rows[0];
    if (user.time_otp - now <= 0) {
        request(`http://47.243.168.18:9090/sms/batch/v2?appkey=NFJKdK&appsecret=brwkTw&phone=84${user.phone}&msg=Your verification code is ${otp}&extend=${now}`,  async(error, response, body) => {
            let data = JSON.parse(body);
            if (data.code == '00000') {
                await connection.execute("UPDATE users SET otp = ?, time_otp = ? WHERE phone = ? ", [otp, timeEnd, user.phone]);
                return res.status(200).json({
                    message: 'Submitted successfully',
                    status: true,
                    timeStamp: timeNow,
                    timeEnd: timeEnd,
                });
            }
        });
    } else {
        return res.status(200).json({
            message: 'Send SMS regularly',
            status: false,
            timeStamp: timeNow,
        });
    }
}

const userInfo = async(req, res) => {
    let auth = req.cookies.auth;

    if (!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    }
    const [rows] = await connection.query('SELECT * FROM users WHERE `token` = ? ', [auth]);

    if (!rows) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    }
    const [recharge] = await connection.query('SELECT * FROM recharge WHERE `phone` = ? AND status = 1', [rows[0].phone]);
    let totalRecharge = 0;
    recharge.forEach((data) => {
        totalRecharge += data.money;
    });
    const [withdraw] = await connection.query('SELECT * FROM withdraw WHERE `phone` = ? AND status = 1', [rows[0].phone]);
    let totalWithdraw = 0;
    withdraw.forEach((data) => {
        totalWithdraw += data.money;
    });

    const { id, password, ip, veri, ip_address, status, time, token, ...others } = rows[0];
    return res.status(200).json({
        message: 'Success',
        status: true,
        data: {
            code: others.code,
            id_user: others.id_user,
            name_user: others.name_user,
            phone_user: others.phone,
            money_user: others.money,
        },
        totalRecharge: totalRecharge,
        totalWithdraw: totalWithdraw,
        timeStamp: timeNow,
    });

}

const changeUser = async(req, res) => {
    let auth = req.cookies.auth;
    let name = req.body.name;
    let type = req.body.type;

    const [rows] = await connection.query('SELECT * FROM users WHERE `token` = ? ', [auth]);
    if(!rows || !type || !name) return res.status(200).json({
        message: 'Failed',
        status: false,
        timeStamp: timeNow,
    });;
    switch (type) {
        case 'editname':
            await connection.query('UPDATE users SET name_user = ? WHERE `token` = ? ', [name, auth]);
            return res.status(200).json({
                message: 'Modified login name successfully',
                status: true,
                timeStamp: timeNow,
            });
            break;
    
        default:
            return res.status(200).json({
                message: 'Failed',
                status: false,
                timeStamp: timeNow,
            });
            break;
    }

}

const changePassword = async(req, res) => {
    let auth = req.cookies.auth;
    let password = req.body.password;
    let newPassWord = req.body.newPassWord;
    // let otp = req.body.otp;

    if(!password || !newPassWord) return res.status(200).json({
        message: 'Failed',
        status: false,
        timeStamp: timeNow,
    });;
    const [rows] = await connection.query('SELECT * FROM users WHERE `token` = ? AND `password` = ? ', [auth, md5(password)]);
    if(rows.length == 0) return res.status(200).json({
        message: 'incorrect password',
        status: false,
        timeStamp: timeNow,
    });;

    // let getTimeEnd = Number(rows[0].time_otp);
    // let tet = new Date(getTimeEnd).getTime();
    // var now = new Date().getTime();
    // var timeRest = tet - now;
    // if (timeRest <= 0) {
    //     return res.status(200).json({
    //         message: 'Mã OTP đã hết hiệu lực',
    //         status: false,
    //         timeStamp: timeNow,
    //     });
    // }

    // const [check_otp] = await connection.query('SELECT * FROM users WHERE `token` = ? AND `password` = ? AND otp = ? ', [auth, md5(password), otp]);
    // if(check_otp.length == 0) return res.status(200).json({
    //     message: 'Mã OTP không chính xác',
    //     status: false,
    //     timeStamp: timeNow,
    // });;
    
    await connection.query('UPDATE users SET otp = ?, password = ? WHERE `token` = ? ', [randomNumber(100000, 999999), md5(newPassWord), auth]);
    return res.status(200).json({
        message: 'Password modification successful',
        status: true,
        timeStamp: timeNow,
    });

}

const checkInHandling = async(req, res) => {
    let auth = req.cookies.auth;
    let data = req.body.data;

    if(!auth) return res.status(200).json({
        message: 'Failed',
        status: false,
        timeStamp: timeNow,
    });;
    const [rows] = await connection.query('SELECT * FROM users WHERE `token` = ? ', [auth]);
    if(!rows) return res.status(200).json({
        message: 'Failed',
        status: false,
        timeStamp: timeNow,
    });;
    if (!data) {
        const [point_list] = await connection.query('SELECT * FROM point_list WHERE `phone` = ? ', [rows[0].phone]);
        return res.status(200).json({
            message: 'Get success',
            datas: point_list,
            status: true,
            timeStamp: timeNow,
        });
    }
    if(data) {
        if(data == 1) {
            const [point_lists] = await connection.query('SELECT * FROM point_list WHERE `phone` = ? ', [rows[0].phone]);
            let check = rows[0].total_money;
            let point_list = point_lists[0];
            let get = 100000;
            if (check >= data && point_list.total1 != 0) {
                await connection.query('UPDATE users SET money = money + ? WHERE phone = ? ', [point_list.total1, rows[0].phone]);
                await connection.query('UPDATE point_list SET total1 = ? WHERE phone = ? ', [0, rows[0].phone]);
                return res.status(200).json({
                    message: `Bạn vừa nhận được ${point_list.total1}.00₫`,
                    status: true,
                    timeStamp: timeNow,
                });
            } else if (check < get && point_list.total1 != 0) {
                return res.status(200).json({
                    message: 'You are not eligible to receive gifts',
                    status: false,
                    timeStamp: timeNow,
                });
            } else if (point_list.total1 == 0) {
                return res.status(200).json({
                    message: 'You have already received this gift',
                    status: false,
                    timeStamp: timeNow,
                });
            }
        };
        if(data == 2) {
            const [point_lists] = await connection.query('SELECT * FROM point_list WHERE `phone` = ? ', [rows[0].phone]);
            let check = rows[0].total_money;
            let point_list = point_lists[0];
            let get = 200000;
            if (check >= get && point_list.total2 != 0) {
                await connection.query('UPDATE users SET money = money + ? WHERE phone = ? ', [point_list.total2, rows[0].phone]);
                await connection.query('UPDATE point_list SET total2 = ? WHERE phone = ? ', [0, rows[0].phone]);
                return res.status(200).json({
                    message: `Bạn vừa nhận được ${point_list.total2}.00₫`,
                    status: true,
                    timeStamp: timeNow,
                });
            } else if (check < get && point_list.total2 != 0) {
                return res.status(200).json({
                    message: 'You are not eligible to receive gifts',
                    status: false,
                    timeStamp: timeNow,
                });
            } else if (point_list.total2 == 0) {
                return res.status(200).json({
                    message: 'You have already received this gift',
                    status: false,
                    timeStamp: timeNow,
                });
            }
        };
        if(data == 3) {
            const [point_lists] = await connection.query('SELECT * FROM point_list WHERE `phone` = ? ', [rows[0].phone]);
            let check = rows[0].total_money;
            let point_list = point_lists[0];
            let get = 500000;
            if (check >= get && point_list.total3 != 0) {
                await connection.query('UPDATE users SET money = money + ? WHERE phone = ? ', [point_list.total3, rows[0].phone]);
                await connection.query('UPDATE point_list SET total3 = ? WHERE phone = ? ', [0, rows[0].phone]);
                return res.status(200).json({
                    message: `Bạn vừa nhận được ${point_list.total3}.00₫`,
                    status: true,
                    timeStamp: timeNow,
                });
            } else if (check < get && point_list.total3 != 0) {
                return res.status(200).json({
                    message: 'You are not eligible to receive gifts',
                    status: false,
                    timeStamp: timeNow,
                });
            } else if (point_list.total3 == 0) {
                return res.status(200).json({
                    message: 'You have already received this gift',
                    status: false,
                    timeStamp: timeNow,
                });
            }
        };
        if(data == 4) {
            const [point_lists] = await connection.query('SELECT * FROM point_list WHERE `phone` = ? ', [rows[0].phone]);
            let check = rows[0].total_money;
            let point_list = point_lists[0];
            let get = 2000000;
            if (check >= get && point_list.total4 != 0) {
                await connection.query('UPDATE users SET money = money + ? WHERE phone = ? ', [point_list.total4, rows[0].phone]);
                await connection.query('UPDATE point_list SET total4 = ? WHERE phone = ? ', [0, rows[0].phone]);
                return res.status(200).json({
                    message: `Bạn vừa nhận được ${point_list.total4}.00₫`,
                    status: true,
                    timeStamp: timeNow,
                });
            } else if (check < get && point_list.total4 != 0) {
                return res.status(200).json({
                    message: 'You are not eligible to receive gifts',
                    status: false,
                    timeStamp: timeNow,
                });
            } else if (point_list.total4 == 0) {
                return res.status(200).json({
                    message: 'You have already received this gift',
                    status: false,
                    timeStamp: timeNow,
                });
            }
        };
        if(data == 5) {
            const [point_lists] = await connection.query('SELECT * FROM point_list WHERE `phone` = ? ', [rows[0].phone]);
            let check = rows[0].total_money;
            let point_list = point_lists[0];
            let get = 5000000;
            if (check >= get && point_list.total5 != 0) {
                await connection.query('UPDATE users SET money = money + ? WHERE phone = ? ', [point_list.total5, rows[0].phone]);
                await connection.query('UPDATE point_list SET total5 = ? WHERE phone = ? ', [0, rows[0].phone]);
                return res.status(200).json({
                    message: `Bạn vừa nhận được ${point_list.total5}.00₫`,
                    status: true,
                    timeStamp: timeNow,
                });
            } else if (check < get && point_list.total5 != 0) {
                return res.status(200).json({
                    message: 'You are not eligible to receive gifts',
                    status: false,
                    timeStamp: timeNow,
                });
            } else if (point_list.total5 == 0) {
                return res.status(200).json({
                    message: 'You have already received this gift',
                    status: false,
                    timeStamp: timeNow,
                });
            }
        };
        if(data == 6) {
            const [point_lists] = await connection.query('SELECT * FROM point_list WHERE `phone` = ? ', [rows[0].phone]);
            let check = rows[0].total_money;
            let point_list = point_lists[0];
            let get = 10000000;
            if (check >= get && point_list.total6 != 0) {
                await connection.query('UPDATE users SET money = money + ? WHERE phone = ? ', [point_list.total6, rows[0].phone]);
                await connection.query('UPDATE point_list SET total6 = ? WHERE phone = ? ', [0, rows[0].phone]);
                return res.status(200).json({
                    message: `Bạn vừa nhận được ${point_list.total6}.00₫`,
                    status: true,
                    timeStamp: timeNow,
                });
            } else if (check < get && point_list.total6 != 0) {
                return res.status(200).json({
                    message: 'You are not eligible to receive gifts',
                    status: false,
                    timeStamp: timeNow,
                });
            } else if (point_list.total6 == 0) {
                return res.status(200).json({
                    message: 'You have already received this gift',
                    status: false,
                    timeStamp: timeNow,
                });
            }
        };
        if(data == 7) {
            const [point_lists] = await connection.query('SELECT * FROM point_list WHERE `phone` = ? ', [rows[0].phone]);
            let check = rows[0].total_money;
            let point_list = point_lists[0];
            let get = 20000000;
            if (check >= get && point_list.total7 != 0) {
                await connection.query('UPDATE users SET money = money + ? WHERE phone = ? ', [point_list.total7, rows[0].phone]);
                await connection.query('UPDATE point_list SET total7 = ? WHERE phone = ? ', [0, rows[0].phone]);
                return res.status(200).json({
                    message: `Bạn vừa nhận được ${point_list.total7}.00₫`,
                    status: true,
                    timeStamp: timeNow,
                });
            } else if (check < get && point_list.total7 != 0) {
                return res.status(200).json({
                    message: 'You are not eligible to receive gifts',
                    status: false,
                    timeStamp: timeNow,
                });
            } else if (point_list.total7 == 0) {
                return res.status(200).json({
                    message: 'You have already received this gift',
                    status: false,
                    timeStamp: timeNow,
                });
            }
        };
    }

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
      date = Date.now();
      date = new Date(Number(date));
    }
    let years = formateT(date.getFullYear());
    let months = formateT(date.getMonth() + 1);
    let days = formateT(date.getDate());
    let weeks = formateT(date.getDay());
  
    let hours = formateT(date.getHours());
    let minutes = formateT(date.getMinutes());
    let seconds = formateT(date.getSeconds());
    // return years + '-' + months + '-' + days + ' ' + hours + '-' + minutes + '-' + seconds;
    return years + " - " + months + " - " + days;
  }

const promotion = async(req, res) => {
    let auth = req.cookies.auth;
    if(!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        }) 
    }
    const [user] = await connection.query('SELECT `phone`, `code`,`invite`, `roses_f`, `roses_f1`, `roses_today` FROM users WHERE `token` = ? ', [auth]);
    const [level] = await connection.query('SELECT * FROM level');
    if(!user) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    };
    let userInfo = user[0];
    // cấp dưới trực tiếp all
    const [f1s] = await connection.query('SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ', [userInfo.code]);

    // cấp dưới trực tiếp hôm nay 
    let f1_today = 0;
    for (let i = 0; i < f1s.length; i++) {
        const f1_time = f1s[i].time; // Mã giới thiệu f1
        let check = (timerJoin(f1_time) == timerJoin()) ? true : false;
        if(check) {
            f1_today += 1;
        }
    }

    // tất cả cấp dưới hôm nay 
    let f_all_today = 0;
    for (let i = 0; i < f1s.length; i++) {
        const f1_code = f1s[i].code; // Mã giới thiệu f1
        const f1_time = f1s[i].time; // time f1
        let check_f1 = (timerJoin(f1_time) == timerJoin()) ? true : false;
        if(check_f1) f_all_today += 1;
        // tổng f1 mời đc hôm nay
        const [f2s] = await connection.query('SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ', [f1_code]);
        for (let i = 0; i < f2s.length; i++) {
            const f2_code = f2s[i].code; // Mã giới thiệu f2
            const f2_time = f2s[i].time; // time f2
            let check_f2 = (timerJoin(f2_time) == timerJoin()) ? true : false;
            if(check_f2) f_all_today += 1;
            // tổng f2 mời đc hôm nay
            const [f3s] = await connection.query('SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ', [f2_code]);
            for (let i = 0; i < f3s.length; i++) {
                const f3_code = f3s[i].code; // Mã giới thiệu f3
                const f3_time = f3s[i].time; // time f3
                let check_f3 = (timerJoin(f3_time) == timerJoin()) ? true : false;
                if(check_f3) f_all_today += 1;
                const [f4s] = await connection.query('SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ', [f3_code]);
                // tổng f3 mời đc hôm nay
                for (let i = 0; i < f4s.length; i++) {
                    const f4_code = f4s[i].code; // Mã giới thiệu f4
                    const f4_time = f4s[i].time; // time f4
                    let check_f4 = (timerJoin(f4_time) == timerJoin()) ? true : false;
                    if(check_f4) f_all_today += 1;
                    // tổng f3 mời đc hôm nay
                }
            }
        }
    }
    
    // Tổng số f2
    let f2 = 0;
    for (let i = 0; i < f1s.length; i++) {
        const f1_code = f1s[i].code; // Mã giới thiệu f1
        const [f2s] = await connection.query('SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ', [f1_code]);
        f2 += f2s.length;
    }
    
    // Tổng số f3
    let f3 = 0;
    for (let i = 0; i < f1s.length; i++) {
        const f1_code = f1s[i].code; // Mã giới thiệu f1
        const [f2s] = await connection.query('SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ', [f1_code]);
        for (let i = 0; i < f2s.length; i++) {
            const f2_code = f2s[i].code;
            const [f3s] = await connection.query('SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ', [f2_code]);
            if(f3s.length > 0) f3 += f3s.length;
        }
    }
    
    // Tổng số f4
    let f4 = 0;
    for (let i = 0; i < f1s.length; i++) {
        const f1_code = f1s[i].code; // Mã giới thiệu f1
        const [f2s] = await connection.query('SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ', [f1_code]);
        for (let i = 0; i < f2s.length; i++) {
            const f2_code = f2s[i].code;
            const [f3s] = await connection.query('SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ', [f2_code]);
            for (let i = 0; i < f3s.length; i++) {
                const f3_code = f3s[i].code;
                const [f4s] = await connection.query('SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ', [f3_code]);
                if(f4s.length > 0) f4 += f4s.length;
            }
        }
    }
    
    return res.status(200).json({
        message: 'Get success',
        level: level,
        info: user,
        status: true,
        invite: {
            f1: f1s.length,
            total_f: f1s.length + f2 + f3 + f4,
            f1_today: f1_today,
            f_all_today: f_all_today,
            roses_f1: userInfo.roses_f1,
            roses_f: userInfo.roses_f,
            roses_all: userInfo.roses_f + userInfo.roses_f1,
            roses_today: userInfo.roses_today,
        },
        timeStamp: timeNow,
    });

}

const myTeam = async(req, res) => {
    let auth = req.cookies.auth;
    if(!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        })
    }
    const [user] = await connection.query('SELECT `phone`, `code`,`invite` FROM users WHERE `token` = ? ', [auth]);
    const [level] = await connection.query('SELECT * FROM level');
    if(!user) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    };
    return res.status(200).json({
        message: 'Receive success',
        level: level,
        info: user,
        status: true,
        timeStamp: timeNow,
    });

}

const listMyTeam = async(req, res) => {
    let auth = req.cookies.auth;
    if(!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        })
    }
    const [user] = await connection.query('SELECT `phone`, `code`,`invite` FROM users WHERE `token` = ? ', [auth]);
    if(!user) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    };
    let userInfo = user[0];
    const [f1] = await connection.query('SELECT `id_user`, `name_user`,`status`, `time`,`roses_f` FROM users WHERE `invite` = ? ORDER BY id DESC', [userInfo.code]);
    const [mem] = await connection.query('SELECT `id_user`, `phone`, `time` FROM users WHERE `invite` = ? ORDER BY id DESC LIMIT 100', [userInfo.code]);
    const [total_roses] = await connection.query('SELECT `f1`, `time` FROM roses WHERE `invite` = ? ORDER BY id DESC LIMIT 100', [userInfo.code]);

    let newMem = [];
    mem.map((data) => {
        let objectMem = {
            id_user: data.id_user,
            phone: '84' + data.phone.slice(0, 1) + '****' + String(data.phone.slice(-4)),
            time: data.time,
        };

        return newMem.push(objectMem);
    });

    return res.status(200).json({
        message: 'Receive success',
        f1: f1,
        mem: newMem,
        total_roses: total_roses,
        status: true,
        timeStamp: timeNow,
    });

}


const listMyRebate = async(req, res) => {
    let auth = req.cookies.auth;
    if(!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        })
    }
    const [user] = await connection.query('SELECT `phone`, `code`,`invite` FROM users WHERE `token` = ? ', [auth]);
    if(!user) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    };
    function timerJoin2(params = '') {
        let date = '';
        if (params) {
            date = new Date(Number(params));
        } else {
            date = new Date();
        }
        let years = formateT(date.getFullYear());
        let months = formateT(date.getMonth() + 1);
        let days = formateT(date.getDate());
        return years +'-'+ months +'-'+ days;
    }

    let userInfo = user[0];
    let date = new Date().getTime();
    let checkTime = timerJoin2(date);
    const [todayRebate] = await connection.query('SELECT SUM(dailyInterest) as money FROM users WHERE `phone` = ?  ORDER BY id DESC ', [userInfo.phone]); 
    const [total_roses] = await connection.query('SELECT `money`, `ttime`,`remarks` FROM invitatioBonus WHERE `phone` = ? AND `remarks` = ? ORDER BY id DESC', [userInfo.phone,'Daily Interest']);
    const [total_rebate] = await connection.query('SELECT SUM(money) as money FROM invitatioBonus WHERE `phone` = ? AND `remarks` = ? ORDER BY id DESC', [userInfo.phone,'Daily Interest']);
    let today_rebateBonus = todayRebate[0].money;
    let total_rebateBonus = total_rebate[0].money;
//   console.log(today_rebateBonus);

    return res.status(200).json({
        message: 'Receive success',
        total_roses: total_roses,
        total_rebate: (total_rebateBonus)?total_rebateBonus:0,
        today_rebate: (today_rebateBonus)?today_rebateBonus:0,
        status: true,
        timeStamp: timeNow,
    });

}

const listFundTransferReport = async (req, res) => {
    let auth = req.cookies.auth;
    if (!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }
    
    const [user] = await connection.query('SELECT `id`, `phone` FROM users WHERE `token` = ?', [auth]);
    if (!user.length) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }

    let userId = user[0].id;

    const [fundTransfers] = await connection.query(
        'SELECT `created_at`, `amount`, `status` FROM fund_transfer WHERE `user_id` = ? AND `remarks` = 0 ORDER BY `created_at` DESC', 
        [userId]
    );
    

    return res.status(200).json({
        message: 'Receive success',
        fundTransfers: fundTransfers,
        status: true,
        timeStamp: new Date().toISOString(),
    });
};

const listGameTransferReport = async (req, res) => {
    let auth = req.cookies.auth;
    if (!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }
    
    const [user] = await connection.query('SELECT `id`, `phone` FROM users WHERE `token` = ?', [auth]);
    if (!user.length) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }

    let userId = user[0].id;

    const [fundTransfers] = await connection.query(
        'SELECT `created_at`, `amount`, `status` FROM fund_transfer WHERE `user_id` = ? AND `remarks` = 1 ORDER BY `created_at` DESC', 
        [userId]
    );
    

    return res.status(200).json({
        message: 'Receive success',
        fundTransfers: fundTransfers,
        status: true,
        timeStamp: new Date().toISOString(),
    });
};

const claimInterest = async(req, res) => {
    let auth = req.cookies.auth;
    if(!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        })
    }
    const [user] = await connection.query('SELECT `phone`, `code`,`invite` FROM users WHERE `token` = ? ', [auth]);
    if(!user) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    };

    let userInfo = user[0];

    const [todayRebate] = await connection.query('SELECT SUM(dailyInterest) as money FROM users WHERE `phone` = ?  ORDER BY id DESC ', [userInfo.phone]); 
    let unClaimedInterest = todayRebate[0].money;

   if (unClaimedInterest>0) 
   {

    await connection.query('UPDATE users SET money = money + ? WHERE phone = ? ', [unClaimedInterest, userInfo.phone]);
    await connection.query('UPDATE users SET dailyInterest = ? WHERE phone = ? ', [0, userInfo.phone]);
    return res.status(200).json({
        message: 'Money Transferred',
        status: true,
        timeStamp: timeNow,
    });
   }
   else
   {
    return res.status(200).json({
        message: 'insufficient Interest balance',
        status: true,
        timeStamp: timeNow,
    });
   }


}

const listMyInvation = async(req, res) => {
    let auth = req.cookies.auth;
    if(!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        })
    }
    const [user] = await connection.query('SELECT `phone`, `code`,`invite` FROM users WHERE `token` = ? ', [auth]);
    if(!user) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    };
    let userInfo = user[0];
    const [f1] = await connection.query('SELECT COUNT(*) AS count FROM users WHERE `invite` = ? ORDER BY id DESC', [userInfo.code]);
    const recordCount = (f1.length)?f1[0].count:0;
    const [f2] = await connection.query('SELECT phone FROM users WHERE `invite` = ? ORDER BY id DESC', [userInfo.code]);
    const phone = f2.map(item => item.phone)
    const [recharge] = await connection.query('SELECT COUNT(*) AS count FROM recharge WHERE `phone` = ? AND money > ?  GROUP BY phone', [phone,499]);
    const rechargeCount = (recharge.length)?recharge.length:0;
//    console.log(recharge.length);
    return res.status(200).json({
        message: 'Receive success',
        direct: recordCount,
        recharge: rechargeCount,
        status: true,
        timeStamp: timeNow,
    });

}

const createPayment = async (req, res) => {

    let auth = req.cookies.auth;
    let money = req.body.money;
    let type = req.body.type;
    let typeid = req.body.typeid;

    if(!auth || !money || money < 1) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        })
    }
    const [user] = await connection.query('SELECT `phone`, `name_user`,`invite` FROM users WHERE `token` = ? ', [auth]);
    let userInfo = user[0];

    const paymentOptions = {
      currency1: 'USD', // The cryptocurrency you want to receive
      currency2: typeid, // The currency to convert to (e.g., USD)
      amount: money, // The amount you want to receive
      buyer_email: userInfo.id_user+'@example.com', // Customer's email
      item_name: userInfo.name_user, // Description of the product or service
      item_number:  userInfo.phone, // Unique identifier for the product or service
    };
  
    try {
      const payment = await client.createTransaction(paymentOptions);
      return res.status(200).json({
        message: 'Order created successfully',
        datas: payment,
        status: true,
        timeStamp: timeNow,
    });
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const createPayment1 = async (req, res) => {
    let auth = req.cookies.auth;
    let money = req.body.money;
    let type = req.body.type;
    let typeid = req.body.typeid;

    console.log(typeid);

    if (!auth || !money || money < 1) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }

    const [user] = await connection.query('SELECT `phone`, `name_user`, `invite` FROM users WHERE `token` = ?', [auth]);
    let userInfo = user[0];

    // Determine the currency based on the typeid
    let currency;
    if (typeid === 'USDT.BEP20') {
        currency = 'USDT_BSC';
    } else {
        currency = 'USDT_TRX';
    }

    const paymentOptions = {
        source_currency: 'USD', // The currency you want to receive
        source_amount: money.toString(), // The amount you want to receive
        order_number: `${Date.now()}`, // Unique order number
        currency: currency, // The currency type
        email: userInfo.phone + '@example.com', // Customer's email
        order_name: userInfo.name_user, // Description of the product or service
        callback_url: 'http://localhost:3000/api/webapi/handlePlisioCallback', // Your callback URL 
        api_key: 'WyrmxIT3Foj0uygOqx6CNdh1AMyV5pPzjOIHUhHphSB7WVgNLjkA_7KFIcxhqQ3_', // Your Plisio API key
    };

    try {
        const apiURL = 'https://plisio.net/api/v1/invoices/new';
        const headers = {
            'Content-Type': 'application/json'
        };

        const response = await axios.post(apiURL, paymentOptions, { headers });
        const payment = response.data;

        if (payment.status === 'success') {
            const clientTransactionId = payment.data.txn_id;
            const invoice = payment.data.invoice_number;
            const currentDateString = new Date().toISOString().split('T')[0];

            const sql = `INSERT INTO recharge SET 
                id_order = ?, 
                transaction_id = ?, 
                phone = ?, 
                money = ?, 
                amount_in_usdt = ?, 
                type = ?, 
                status = ?, 
                today = ?, 
                url = ?, 
                time = ?`;

            await connection.execute(sql, [
                invoice, clientTransactionId, userInfo.phone, money, money, type, 0, currentDateString, payment.data.invoice_url, Date.now()
            ]);

            return res.status(200).json({
                message: 'Order created successfully',
                datas: payment.data,
                status: true,
                timeStamp: new Date().toISOString(),
            });
        } else {
            return res.status(200).json({
                message: 'Failed to create order',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Internal Server Error',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }
};




const handlePlisioCallback = async (req, res) => {
    try {
        const response = req.body;

        if (!response) {
            return res.status(400).send('Invalid request');
        }

        const {
            order_number,
            status,
            source_amount,
            txn_id,
            order_name,
            invoice_total_sum
        } = response;

        if (status === "completed" || (status === "mismatch" && source_amount >= invoice_total_sum)) {
            const updateInvestment = await connection.query(
                'UPDATE recharge SET status = 1 WHERE id_order = ? AND status = 0',
                [order_number]
            );

            if (updateInvestment[0].affectedRows > 0) {
                const [userDetail] = await connection.query('SELECT id, phone, status, money FROM users WHERE name_user = ?', [order_name]);
                const user = userDetail[0];

                if (user.status === 0) {
                    const updatedUser = {
                        status: 1,
                        updated_at: new Date(),
                    };
                    await connection.query('UPDATE users SET ? WHERE id = ?', [updatedUser, user.id]);

                } else {
                    const newPackage = user.money + source_amount;
                    await connection.query('UPDATE users SET money = ?, status = ? WHERE id = ?', [newPackage, 1, user.id]);
                }

                const checkTime = new Date().toISOString().split('T')[0];
                const [sumResult] = await connection.query(
                    'SELECT SUM(money) as sumOfRecharge FROM recharge WHERE phone = ? AND status = 1 AND today = ?',
                    [user.phone, checkTime]
                );

                const [rowCount] = await connection.query('SELECT COUNT(*) as count FROM recharge WHERE phone = ?', [user.phone]);
                if (rowCount[0].count === 0) {
                    await directBonus(source_amount, user.phone);
                }

                let sumOfRecharge = sumResult[0].sumOfRecharge || 0;

                if (sumOfRecharge >= 500) {
                    await rechargeBonus(user.phone, sumOfRecharge);
                }

                const [recharge] = await connection.query('SELECT * FROM recharge WHERE id_order = ? AND status = ?', [order_number, 1]);

                return res.status(200).json({
                    message: 'Order Submitted successfully',
                    datas: recharge[0],
                    status: true,
                    timeStamp: new Date().toISOString(),
                });
            }
        }

        res.status(200).send('Callback handled successfully');
    } catch (error) {
        console.error('Callback error:', error);
        res.status(500).send('Internal Server Error');
    }
};




  const rechargeCoin = async(req, res) => {
    let auth = req.cookies.auth;
    let money = req.body.money;
    let type = req.body.type;
    let typeid = req.body.typeid;
    let transaction_id = req.body.transaction_id;
    let url = req.body.url;
    let currency = req.body.currency;

    if (type != 'cancel') {
        if (!auth || !money || money < 1.11) {
            return res.status(200).json({
                message: 'Failed',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }
    }

    const [user] = await connection.query('SELECT `phone`, `code`, `invite` FROM users WHERE `token` = ?', [auth]);
    let userInfo = user[0];
    if (!userInfo) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }

    if (type == 'cancel') {
        await connection.query('UPDATE recharge SET status = 2 WHERE phone = ? AND id_order = ? AND status = ?', [userInfo.phone, typeid, 0]);
        return res.status(200).json({
            message: 'Order canceled successfully',
            status: true,
            timeStamp: new Date().toISOString(),
        });
    }

    let time = new Date().getTime();
    const date = new Date();
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
        return years + '-' + months + '-' + days;
    }

    let checkTime = timerJoin(time);
    let id_time = date.getUTCFullYear() + '' + date.getUTCMonth() + 1 + '' + date.getUTCDate();
    let id_order = Math.floor(Math.random() * (99999999999999 - 10000000000000 + 1)) + 10000000000000;
    let amount_in_usdt = Number(money);
    money = Number(money * 90);
    let client_transaction_id = id_time + id_order;

    // Check if this is the first recharge for this phone
    const [rowCount] = await connection.query('SELECT COUNT(*) as count FROM recharge WHERE phone = ?', [userInfo.phone]);
    if (rowCount[0].count === 0) {
        await directBonus(money, userInfo.phone);
    }

    const sql = `INSERT INTO recharge SET 
        id_order = ?,
        transaction_id = ?,
        phone = ?,
        money = ?,
        amount_in_usdt = ?,
        type = ?,
        status = ?,
        today = ?,
        url = ?,
        time = ?`;
    await connection.execute(sql, [client_transaction_id, transaction_id, userInfo.phone, money, amount_in_usdt, currency, 0, checkTime, url, time]);

    // Calculate the sum of recharges for the current day where status is 1
    const [sumResult] = await connection.query(
        'SELECT SUM(money) as sumOfRecharge FROM recharge WHERE phone = ? AND status = 1 AND today = ?',
        [userInfo.phone, checkTime]
    );

    let sumOfRecharge = sumResult[0].sumOfRecharge || 0;

    if (sumOfRecharge >= 500) {
        await rechargeBonus(userInfo.phone, sumOfRecharge);
    }

    const [recharge] = await connection.query('SELECT * FROM recharge WHERE phone = ? AND status = ?', [userInfo.phone, 0]);
    return res.status(200).json({
        message: 'Order Submitted successfully',
        datas: recharge[0],
        status: true,
        timeStamp: new Date().toISOString(),
    });
}


const rechargeBonus = async (phone, sumOfRecharge) => {
    let bonus = 0;

    if (sumOfRecharge >= 500 && sumOfRecharge < 5000) {
        bonus = 5;
    } else if (sumOfRecharge >= 5000 && sumOfRecharge < 50000) {
        bonus = 50;
    } else if (sumOfRecharge >= 50000 && sumOfRecharge < 100000) {
        bonus = 500;
    } else if (sumOfRecharge >= 100000 && sumOfRecharge < 200000) {
        bonus = 1000;
    } else if (sumOfRecharge >= 200000) {
        bonus = 2000;
    }

    if (bonus > 0) {
        const [userResult] = await connection.query('SELECT `id` FROM users WHERE phone = ?', [phone]);
        let user = userResult[0];

        if (!user) {
            throw new Error('User not found');
        }

        const sql = `INSERT INTO incomes (user_id, amount, comm, remarks, rname) VALUES (?, ?, ?, ?, ?)`;
        await connection.execute(sql, [user.id, sumOfRecharge, bonus, 'Recharge Bonus', phone]);

        // Update the user's money with the bonus
        await connection.query('UPDATE users SET money = money + ? WHERE id = ?', [bonus, user.id]);
    }
};


const directBonus = async (money, phone) => {
    // Select the user where phone column matches with phone parameter
    const [userResult] = await connection.query('SELECT `id`, `invite` FROM users WHERE phone = ?', [phone]);
    let user = userResult[0];

    if (!user) {
        throw new Error('User not found');
    }

    // Get the invite code from the user
    let invite = user.invite;

    // Select the sponsor where code matches the invite code
    const [sponsorResult] = await connection.query('SELECT `id`, `money` FROM users WHERE code = ?', [invite]);
    let sponsor = sponsorResult[0];

    if (!sponsor) {
        throw new Error('Sponsor not found');
    }

    // Calculate the bonus
    let bonus = 0.05 * money;

    // Insert data into incomes table
    const sql = `INSERT INTO incomes (user_id, amount, comm, remarks, rname) VALUES (?, ?, ?, ?, ?)`;
    await connection.execute(sql, [sponsor.id, money, bonus, 'Direct Bonus', phone]);

    // Update the sponsor's money
    const updateSql = 'UPDATE users SET money = money + ? WHERE id = ?';
    await connection.execute(updateSql, [bonus, sponsor.id]);
};


const recharge = async(req, res) => {
    let auth = req.cookies.auth;
    let money = req.body.money;
    let type = req.body.type;
    let typeid = req.body.typeid;
    let manualType = req.body.manualType;

    if (type != 'cancel') {
        if(!auth || !money || money < 200) {
        
            return res.status(200).json({
                message: 'Failed',
                status: false,
                timeStamp: timeNow,
            })
        }
    }
    const [user] = await connection.query('SELECT `phone`, `code`,`invite` FROM users WHERE `token` = ? ', [auth]);
    let userInfo = user[0];
    if(!user) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    };
    if (type == 'cancel') {
        await connection.query('UPDATE recharge SET status = 2 WHERE phone = ? AND id_order = ? AND status = ? ', [userInfo.phone, typeid, 0]);
        return res.status(200).json({
            message: 'Order canceled successfully',
            status: true,
            timeStamp: timeNow,
        });
    }
    const [recharge] = await connection.query('SELECT * FROM recharge WHERE phone = ? AND status = ? AND type ', [userInfo.phone, 0,'bank']);
    if (recharge.length == 0) {
        let time = new Date().getTime();
        const date = new Date();
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
            return years + '-' + months + '-' + days;
        }
        let checkTime = timerJoin(time);
        let id_time = date.getUTCFullYear() + '' + date.getUTCMonth() + 1 + '' + date.getUTCDate();
        let id_order = Math.floor(Math.random() * (99999999999999 - 10000000000000 + 1) ) + 10000000000000;
        // let vat = Math.floor(Math.random() * (2000 - 0 + 1) ) + 0;

        money = Number(money);
        let client_transaction_id = id_time + id_order;
        const formData = {
            username: process.env.accountBank,
            secret_key: process.env.secret_key,
            client_transaction: client_transaction_id,
            amount: money,
        }

//   console.log(manualType);
      if (manualType=="Api") 
      {
     
            const apiUrl = 'https://payin.gamegateway.online/v3/generateToken';
            const postData = {
                userKey: 'KBS2cce4f7216',
                userToken: 'ef6534b8e22e63d31226a5428f9f18df',
            };

            const headers = {
            'Content-Type': 'application/json',
            };

            axios.post(apiUrl, postData, { headers })
            .then(response => {   
              
                if (response.data.status=="FAILED") 
                {
                    return res.status(200).json({
                        message: response.data.error,
                        status: false,
                        timeStamp: timeNow,
                    })
                }

             
           let token = response.data.data.token;

            const apiUrl = 'https://payin.gamegateway.online/v3/generatePaymentLink';
            const postData = {
                userKey: 'KBS2cce4f7216',
                userToken: 'ef6534b8e22e63d31226a5428f9f18df',
                genrateToken:token,
                amount:money,
                option:'INTENT',
                orderId:"FC"+id_order
            };

            const headers = {
            'Content-Type': 'application/json',
            };

           axios.post(apiUrl, postData, { headers }).then(async response => {
                if (response.data.data.status=="FAILED") 
                {
                    return res.status(200).json({
                        message: response.data.error,
                        status: false,
                        timeStamp: timeNow,
                    })
                }              


                const sql = `INSERT INTO recharge SET 
                id_order = ?,
                transaction_id = ?,
                phone = ?,
                money = ?,
                type = ?,
                status = ?,
                today = ?,
                url = ?,
                time = ?`; 
                await connection.execute(sql, [response.data.data.orderId,response.data.data.txnId, userInfo.phone, money, type, 0, checkTime, '0', time]);
                return res.status(200).json({
                    message: 'Order created successfully',
                    datas: response.data.data,
                    status: true,
                    manualType:0,
                    timeStamp: timeNow,
                });

            })
            .catch(error => {
                return res.status(200).json({
                    message: 'Failed',
                    status: false,
                    timeStamp: timeNow,
                })
            });

                

            })
            .catch(error => {
                return res.status(200).json({
                    message: 'Failed',
                    status: false,
                    timeStamp: timeNow,
                })
            });
               
      }
      else
      {

       let  response = {amount: money, orderId: id_order};
        return res.status(200).json({
            message: 'Order created successfully',
            datas: response,
            status: true,
            manualType:1,
            timeStamp: timeNow,
        });


      }


     
    } else {
        return res.status(200).json({
            message: 'Get success',
            datas: recharge[0],
            status: true,
            timeStamp: timeNow,
        });
    }

}


const manualRecharge = async(req, res) => {
    let auth = req.cookies.auth;
    let money = req.body.money;
    let type = req.body.type;
    let typeid = req.body.typeid;
    let reference_no = req.body.reference_no;

    if (type != 'cancel') {
        if(!auth || !money || money < 200) {
        
            return res.status(200).json({
                message: 'Failed',
                status: false,
                timeStamp: timeNow,
            })
        }
    }
    const [user] = await connection.query('SELECT `phone`, `code`,`invite` FROM users WHERE `token` = ? ', [auth]);
    let userInfo = user[0];
    if(!user) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    };
    if (type == 'cancel') {
        await connection.query('UPDATE recharge SET status = 2 WHERE phone = ? AND id_order = ? AND status = ? ', [userInfo.phone, typeid, 0]);
        return res.status(200).json({
            message: 'Order canceled successfully',
            status: true,
            timeStamp: timeNow,
        });
    }
    const [recharge] = await connection.query('SELECT * FROM recharge WHERE phone = ?  AND type = ? AND utr = ? ', [userInfo.phone,'Manual',reference_no]);
    if (recharge.length == 0) {
        let time = new Date().getTime();
        const date = new Date();
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
            return years + '-' + months + '-' + days;
        }
        let checkTime = timerJoin(time);
        let id_time = date.getUTCFullYear() + '' + date.getUTCMonth() + 1 + '' + date.getUTCDate();
        let id_order = Math.floor(Math.random() * (99999999999999 - 10000000000000 + 1) ) + 10000000000000;
        // let vat = Math.floor(Math.random() * (2000 - 0 + 1) ) + 0;

        money = Number(money);
        let client_transaction_id = id_time + id_order;
        const formData = {
            username: process.env.accountBank,
            secret_key: process.env.secret_key,
            client_transaction: client_transaction_id,
            amount: money,
        }

                const sql = `INSERT INTO recharge SET 
                id_order = ?,
                transaction_id = ?,
                phone = ?,
                money = ?,
                type = ?,
                status = ?,
                today = ?,
                url = ?,
                utr = ?,
                time = ?`; 
                await connection.execute(sql, [id_order,id_order, userInfo.phone, money, 'Manual', 0, checkTime, '0',reference_no,time]);
                return res.status(200).json({
                    message: 'Order created successfully',
                    datas: money,
                    status: true,
                    manualType:0,
                    timeStamp: timeNow,
                });

     
    } else {
        return res.status(200).json({
            message: 'Get success',
            datas: recharge[0],
            status: true,
            timeStamp: timeNow,
        });
    }

}

const addBank = async(req, res) => {
    let auth = req.cookies.auth;
    let usdtBep20 = req.body.usdtBep20;
    let usdttrc20 = req.body.usdttrc20;
    let timeNow = new Date().toISOString();

    if (!auth || !usdtBep20 || !usdttrc20) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    }

    const [user] = await connection.query('SELECT `phone`, `id` FROM users WHERE `token` = ?', [auth]);
    let userInfo = user[0];

    if (!userInfo) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    }

    const [existingUserBank] = await connection.query('SELECT * FROM user_bank WHERE phone = ? ', [userInfo.phone]);
    
    if (existingUserBank.length === 0) {
        let time = new Date().getTime();
        const sql = `INSERT INTO user_bank SET 
        phone = ?,
        usdtBep20 = ?,
        usdttrc20 = ?,
        time = ?`;
        await connection.execute(sql, [userInfo.phone, usdtBep20, usdttrc20, time]);
        return res.status(200).json({
            message: 'Added crypto addresses successfully',
            status: true,
            timeStamp: timeNow,
        });
    } else {
        return res.status(200).json({
            message: 'The account has already been linked to the bank',
            status: false,
            timeStamp: timeNow,
        });
    }
}


const infoUserBank = async(req, res) => {
    let auth = req.cookies.auth;
    if(!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        })
    }
    const [user] = await connection.query('SELECT `phone`, `code`,`invite`, `win_wallet`,`money` FROM users WHERE `token` = ? ', [auth]);
    let userInfo = user[0];
    if(!user) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    };
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
        return years + '-' + months + '-' + days;
    }
    let date = new Date().getTime();
    let checkTime = timerJoin(date);
    const [recharge] = await connection.query('SELECT * FROM recharge WHERE phone = ? AND today = ? AND status = 1 ', [userInfo.phone, checkTime]); 
    const [minutes_1] = await connection.query('SELECT * FROM minutes_1 WHERE phone = ? AND today = ? ', [userInfo.phone, checkTime]); 
    let total = 0;
    recharge.forEach((data) => {
        total += data.money;
    });
    let total2 = 0;
    minutes_1.forEach((data) => {
        total2 += data.money;
    });

    let result = 0;
    if(total - total2 > 0) result = total - total2;

    const [userBank] = await connection.query('SELECT * FROM user_bank WHERE phone = ? ', [userInfo.phone]); 
    return res.status(200).json({
        message: 'Get success',
        datas: userBank,
        userInfo: user,
        result: result,
        status: true,
        timeStamp: timeNow,
    });
}

const withdrawal3 = async(req, res) => {
    let auth = req.cookies.auth;
    let money = req.body.money;
    let password = req.body.password;
    if(!auth || !money || !password || money < 200) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        })
    }
    const [user] = await connection.query('SELECT `phone`, `code`,`invite`, `money` FROM users WHERE `token` = ? AND password = ?', [auth, md5(password)]);

    if(user.length == 0) {
        return res.status(200).json({
            message: 'incorrect password',
            status: false,
            timeStamp: timeNow,
        });
    };
    let userInfo = user[0];
    const date = new Date();
    let id_time = date.getUTCFullYear() + '' + date.getUTCMonth() + 1 + '' + date.getUTCDate();
    let id_order = Math.floor(Math.random() * (99999999999999 - 10000000000000 + 1) ) + 10000000000000;

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
        return years + '-' + months + '-' + days;
    }
    let dates = new Date().getTime();
    let checkTime = timerJoin(dates);
    const [recharge] = await connection.query('SELECT * FROM recharge WHERE phone = ? AND today = ? AND status = 1 ', [userInfo.phone, checkTime]); 
    const [minutes_1] = await connection.query('SELECT * FROM minutes_1 WHERE phone = ? AND today = ? ', [userInfo.phone, checkTime]); 
    let total = 0;
    recharge.forEach((data) => {
        total += data.money;
    });
    let total2 = 0;
    minutes_1.forEach((data) => {
        total2 += data.money;
    });

    let result = 0;
    if(total - total2 > 0) result = total - total2;
    
    const [user_bank] = await connection.query('SELECT * FROM user_bank WHERE `phone` = ?', [userInfo.phone]);
    const [withdraw] = await connection.query('SELECT * FROM withdraw WHERE `phone` = ? AND today = ?', [userInfo.phone, checkTime]);
    if (user_bank.length != 0) {
        if (withdraw.length < 3) {
            if (userInfo.money - money >= 0) {
                if (result == 0) {
                    let infoBank = user_bank[0];
                    const sql = `INSERT INTO withdraw SET 
                    id_order = ?,
                    phone = ?,
                    money = ?,
                    account_number = ?,
                    name_bank = ?,
                    ifsc_code = ?,
                    name_user = ?,
                    status = ?,
                    today = ?,
                    time = ?`;
                    await connection.execute(sql, [id_time + '' + id_order, userInfo.phone, money, infoBank.account_number, infoBank.name_bank,infoBank.ifsc_code, infoBank.name_user, 0, checkTime, dates]);
                    await connection.query('UPDATE users SET money = money - ? WHERE phone = ? ', [money, userInfo.phone]);
                    return res.status(200).json({
                        message: 'Withdraw money successfully',
                        status: true,
                        money: userInfo.money - money,
                        timeStamp: timeNow,
                    });
                } else {
                    return res.status(200).json({
                        message: 'The total bet amount is not enough to fulfill the request',
                        status: false,
                        timeStamp: timeNow,
                    });
                }
            } else {
                return res.status(200).json({
                    message: 'Insufficient balance to fulfill the request',
                    status: false,
                    timeStamp: timeNow,
                });
            }
        } else {
            return res.status(200).json({
                message: 'You can only make 3 withdrawals per day',
                status: false,
                timeStamp: timeNow,
            });
        }
    } else {
        return res.status(200).json({
            message: 'Please link your bank first',
            status: false,
            timeStamp: timeNow,
        });
    }

}

const fundTransfer = async (req, res) => {
    const auth = req.cookies.auth;
    const amount = req.body.amount;
    const password = req.body.password;
    const timeNow = new Date().toISOString();  // Ensure you have the correct `timeNow` initialization

    if (!auth || !amount || !password || amount <= 0) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    }

    // Check user authentication and password
    const [user] = await connection.query(
        'SELECT `id`,`phone`, `money`, `ai_balance` FROM users WHERE `token` = ? AND password = ?',
        [auth, md5(password)]
    );

    if (user.length == 0) {
        return res.status(200).json({
            message: 'Incorrect password',
            status: false,
            timeStamp: timeNow,
        });
    }

    let userInfo = user[0];

    // Check if user has sufficient balance
    if (userInfo.money < amount) {
        return res.status(200).json({
            message: 'Insufficient balance to fulfill the request',
            status: false,
            timeStamp: timeNow,
        });
    }

    // Insert the transfer details into fund_transfer table
    const sql = `INSERT INTO fund_transfer SET 
        user_id = ?, 
        amount = ?, 
        status = ?, 
        created_at = ?,    
        updated_at = ?,
        remarks = ?`;
    await connection.execute(sql, [ userInfo.id, amount, 'active', timeNow, timeNow,0]);

    // Update the user's balance
    await connection.query('UPDATE users SET money = money - ?, ai_balance = ai_balance + ? WHERE id = ?', [amount, amount, userInfo.id]);

    return res.status(200).json({
        message: 'Fund transfer successful',
        status: true,
        balance: userInfo.money - amount,
        ai_balance: userInfo.ai_balance + amount,
        timeStamp: timeNow,
    });
}

const fundTransferGame = async (req, res) => {
    const auth = req.cookies.auth;
    const amount = parseFloat(req.body.amount); // Ensure amount is a number
    const password = req.body.password;
    const timeNow = new Date().toISOString();

    if (!auth || !amount || !password || amount <= 0) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    }

    try {
        // Check user authentication and password
        const [user] = await connection.query(
            'SELECT `id`,`phone`, `money`, `win_wallet` FROM users WHERE `token` = ? AND `password` = ?',
            [auth, md5(password)]
        );

        if (user.length === 0) {
            return res.status(200).json({
                message: 'Incorrect password',
                status: false,
                timeStamp: timeNow,
            });
        }

        let userInfo = user[0];

        // Check if user has sufficient balance
        if (userInfo.win_wallet < amount) {
            return res.status(200).json({
                message: 'Insufficient balance to fulfill the request',
                status: false,
                timeStamp: timeNow,
            });
        }

        // Insert the transfer details into fund_transfer table
        const sql = `INSERT INTO fund_transfer SET 
            user_id = ?, 
            amount = ?, 
            status = ?, 
            created_at = ?,    
            updated_at = ?,
            remarks = ?`;
        await connection.execute(sql, [userInfo.id, amount, 'active', timeNow, timeNow, 1]);

        // Update the user's balance
        await connection.query('UPDATE users SET win_wallet = win_wallet - ?, money = money + ? WHERE id = ?', [amount, amount, userInfo.id]);

        return res.status(200).json({
            message: 'Fund transfer successful',
            status: true,
            balance: userInfo.win_wallet - amount,
            money: userInfo.money + amount,
            timeStamp: timeNow,
        });
    } catch (error) {
        console.error('Error during fund transfer:', error);
        return res.status(500).json({
            message: 'Internal server error',
            status: false,
            timeStamp: timeNow,
        });
    }
};


const withdrawal4 = async(req, res) => {
    let auth = req.cookies.auth;
    let money = req.body.money;
    let paymentMode = req.body.paymentMode;
    let password = req.body.password;
    console.log(paymentMode);
    if(!auth || !paymentMode || !money || !password || money < 200) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        })
    }
    const [user] = await connection.query('SELECT `phone`, `code`,`invite`, `money` FROM users WHERE `token` = ? AND password = ?', [auth, md5(password)]);
    if(user.length == 0) {
        return res.status(200).json({
            message: 'incorrect password',
            status: false,
            timeStamp: timeNow,
        });
    };

    let userInfo = user[0];
    const date = new Date();
    let id_time = date.getUTCFullYear() + '' + date.getUTCMonth() + 1 + '' + date.getUTCDate();
    let id_order = Math.floor(Math.random() * (99999999999999 - 10000000000000 + 1) ) + 10000000000000;

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
        return years + '-' + months + '-' + days;
    }
    let dates = new Date().getTime();
    let checkTime = timerJoin(dates);
    const [recharge] = await connection.query('SELECT * FROM recharge WHERE phone = ? AND today = ? AND status = 1 ', [userInfo.phone, checkTime]); 
    const [minutes_1] = await connection.query('SELECT * FROM minutes_1 WHERE phone = ? AND today = ? ', [userInfo.phone, checkTime]); 
    let total = 0;
    recharge.forEach((data) => {
        total += data.money;
    });
    let total2 = 0;
    minutes_1.forEach((data) => {
        total2 += data.money;
    });

    let result = 0;
    if(total - total2 > 0) result = total - total2;
    
    const [user_bank] = await connection.query('SELECT * FROM user_bank WHERE `phone` = ?', [userInfo.phone]);
    const [withdraw] = await connection.query('SELECT * FROM withdraw WHERE `phone` = ? AND today = ?', [userInfo.phone, checkTime]);
    if (user_bank.length != 0) {
        let  wallet = '';
        if (paymentMode=='USDT.BEP20') 
        {
          wallet = user_bank[0].usdtBep20 ;
        }
        else
        {
         wallet = user_bank[0].usdttrc20;        
        }
        if(wallet=='') {
            return res.status(200).json({
                message: 'Please link your Crypto Wallet',
                status: false,
                timeStamp: timeNow,
            });
        };


        if (withdraw.length < 3) {
            if (userInfo.money - money >= 0) {
                if (result == 0) {
                    let infoBank = user_bank[0];
                    const sql = `INSERT INTO withdraw SET 
                    id_order = ?,
                    phone = ?,
                    money = ?,
                    account_number = ?,
                    name_bank = ?,
                    ifsc_code = ?,
                    name_user = ?,
                    status = ?,
                    today = ?,
                    amount_in_usd = ?,
                    wallet = ?,
                    walletType = ?,
                    time = ?`;
                    await connection.execute(sql, [id_time + '' + id_order, userInfo.phone, money, infoBank.account_number, infoBank.name_bank,infoBank.ifsc_code, infoBank.name_user, 0, checkTime,money/90,wallet,paymentMode, dates]);
                    await connection.query('UPDATE users SET money = money - ? WHERE phone = ? ', [money, userInfo.phone]);
                    return res.status(200).json({
                        message: 'Withdraw money successfully',
                        status: true,
                        money: userInfo.money - money,
                        timeStamp: timeNow,
                    });
                } else {
                    return res.status(200).json({
                        message: 'The total bet amount is not enough to fulfill the request',
                        status: false,
                        timeStamp: timeNow,
                    });
                }
            } else {
                return res.status(200).json({
                    message: 'Insufficient balance to fulfill the request',
                    status: false,
                    timeStamp: timeNow,
                });
            }
        } else {
            return res.status(200).json({
                message: 'You can only make 3 withdrawals per day',
                status: false,
                timeStamp: timeNow,
            });
        }
    } else {
        return res.status(200).json({
            message: 'Please link your bank first',
            status: false,
            timeStamp: timeNow,
        });
    }

}


const recharge2 = async(req, res) => {
    let auth = req.cookies.auth;
    let money = req.body.money;
    if(!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        })
    }
    const [user] = await connection.query('SELECT `phone`, `code`,`invite` FROM users WHERE `token` = ? ', [auth]);
    let userInfo = user[0];
    if(!user) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    };
    const [recharge] = await connection.query('SELECT * FROM recharge WHERE phone = ? AND status = ? AND type ', [userInfo.phone, 0,'bank']);
    const [bank_recharge] = await connection.query('SELECT * FROM bank_recharge ');
    if (recharge.length != 0) {
        console.log("hi");
        return res.status(200).json({
            message: 'Get success',
            datas: recharge[0],
            infoBank: bank_recharge,
            status: true,
            timeStamp: timeNow,
        });
    } else {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    }

}


const checkRechargeStatus = async(req, res) => {
    let auth = req.cookies.auth;
    let orderId = req.body.orderId;
    if(!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        })
    }
    const [user] = await connection.query('SELECT `phone`, `code`,`invite` FROM users WHERE `token` = ? ', [auth]);
    let userInfo = user[0];
    if(!user) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    };
    const [recharge] = await connection.query('SELECT * FROM recharge WHERE phone = ? AND status = ? AND id_order = ? ', [userInfo.phone, 1,orderId]);
    if (recharge.length != 0) {
        return res.status(200).json({
            message: 'recharge success',
            datas: recharge[0],
            status: true,
            timeStamp: timeNow,
        });
    } else {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    }

}

const listRecharge = async(req, res) => {
    let auth = req.cookies.auth;
    if(!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        })
    }
    const [user] = await connection.query('SELECT `phone`, `code`,`invite` FROM users WHERE `token` = ? ', [auth]);
    let userInfo = user[0];
    if(!user) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    };
    const [recharge] = await connection.query('SELECT * FROM recharge WHERE phone = ? ORDER BY id DESC ', [userInfo.phone]);
    return res.status(200).json({
        message: 'Get success',
        datas: recharge,
        status: true,
        timeStamp: timeNow,
    });
}

const search = async(req, res) => {
    let auth = req.cookies.auth;
    let phone = req.body.phone;
    if(!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        })
    }
    const [user] = await connection.query('SELECT `phone`, `code`,`invite`, `level` FROM users WHERE `token` = ? ', [auth]);
    if(user.length == 0) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    };
    let userInfo = user[0];
    if (userInfo.level == 1) {
        const [users] = await connection.query(`SELECT * FROM users WHERE phone = ? ORDER BY id DESC `, [phone]);
        return res.status(200).json({
            message: 'Get success',
            datas: users,
            status: true,
            timeStamp: timeNow,
        });
    } else if (userInfo.level == 2) {
        const [users] = await connection.query(`SELECT * FROM users WHERE phone = ? ORDER BY id DESC `, [phone]);
        if (users.length == 0) {
            return res.status(200).json({
                message: 'Get success',
                datas: [],
                status: true,
                timeStamp: timeNow,
            });
        } else {
            if (users[0].ctv == userInfo.phone) {
                return res.status(200).json({
                    message: 'Get success',
                    datas: users,
                    status: true,
                    timeStamp: timeNow,
                });
            } else {
                return res.status(200).json({
                    message: 'Failed',
                    status: false,
                    timeStamp: timeNow,
                });
            }
        }
    } else {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    }
}


const listWithdraw = async(req, res) => {
    let auth = req.cookies.auth;
    if(!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        })
    }
    const [user] = await connection.query('SELECT `phone`, `code`,`invite` FROM users WHERE `token` = ? ', [auth]);
    let userInfo = user[0];
    if(!user) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    };
    const [recharge] = await connection.query('SELECT * FROM withdraw WHERE phone = ? ORDER BY id DESC ', [userInfo.phone]);
    return res.status(200).json({
        message: 'Get success',
        datas: recharge,
        status: true,
        timeStamp: timeNow,
    });
}

const useRedenvelope = async(req, res) => {
    let auth = req.cookies.auth;
    let code = req.body.code;
    if(!auth || !code) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        })
    }
    const [user] = await connection.query('SELECT `phone`, `code`,`invite` FROM users WHERE `token` = ? ', [auth]);
    let userInfo = user[0];
    if(!user) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    };
    const [redenvelopes] = await connection.query(
        'SELECT * FROM redenvelopes WHERE id_redenvelope = ?', [code]);
        
    if (redenvelopes.length == 0) {
        return res.status(200).json({
            message: 'Redemption code error',
            status: false,
            timeStamp: timeNow,
        });
    } else {
        let infoRe = redenvelopes[0];
        const d = new Date();
        const time = d.getTime();
        if (infoRe.status == 0) {
            await connection.query('UPDATE redenvelopes SET used = ?, status = ? WHERE `id_redenvelope` = ? ', [0, 1, infoRe.id_redenvelope]); 
            await connection.query('UPDATE users SET money = money + ? WHERE `phone` = ? ', [infoRe.money, userInfo.phone]); 
            let sql = 'INSERT INTO redenvelopes_used SET phone = ?, phone_used = ?, id_redenvelops = ?, money = ?, `time` = ? ';
            await connection.query(sql, [infoRe.phone, userInfo.phone, infoRe.id_redenvelope, infoRe.money, time]); 
            return res.status(200).json({
                message: `Get success +${infoRe.money}`,
                status: true,
                timeStamp: timeNow,
            });
        } else {
            return res.status(200).json({
                message: 'Gift code has been used',
                status: false,
                timeStamp: timeNow,
            });
        }
    }
}

const callback_bank = async(req, res) => {
    let transaction_id = req.body.transaction_id;
    let client_transaction_id = req.body.client_transaction_id;
    let amount = req.body.amount;
    let requested_datetime = req.body.requested_datetime;
    let expired_datetime = req.body.expired_datetime;
    let payment_datetime = req.body.payment_datetime;
    let status = req.body.status;
    if(!transaction_id) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        })  
    }
    if (status == 2) {
        await connection.query(`UPDATE recharge SET status = 1 WHERE id_order = ?`, [client_transaction_id]);
        const [info] = await connection.query(`SELECT * FROM recharge WHERE id_order = ?`, [client_transaction_id]);
        await connection.query('UPDATE users SET money = money + ?, total_money = total_money + ? WHERE phone = ? ', [info[0].money, info[0].money, info[0].phone]);
        return res.status(200).json({
            message: 0,
            status: true,
        });
    } else {
        await connection.query(`UPDATE recharge SET status = 2 WHERE id = ?`, [id]);

        return res.status(200).json({
            message: 'Order canceled successfully',
            status: true,
            datas: recharge,
        });
    }
}

const getAIBonus = async (req, res) => {
    let auth = req.cookies.auth;

    if (!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
        });
    }

    const [user] = await connection.query('SELECT `id`,`phone`, `code`, `invite` FROM users WHERE `token` = ?', [auth]);

    if (!user.length) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
        });
    }

    let userInfo = user[0];

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    const [aiBonus] = await connection.query('SELECT `stage`, `bet`, `comm`, `created_at` FROM incomes WHERE `user_id` = ? AND `remarks` = "AI bonus" ORDER BY `created_at` DESC LIMIT ? OFFSET ?', [userInfo.id, limit, offset]);
    const [[{ total }]] = await connection.query('SELECT COUNT(*) as total FROM incomes WHERE `user_id` = ? AND `remarks` = "AI bonus"', [userInfo.id]);

    return res.status(200).json({
        message: 'Success',
        aiBonus: aiBonus,
        total: total,
        status: true,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
    });
};



const getAIBalance = async (req, res) => {
    let auth = req.cookies.auth;

    if (!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }

    try {
        const [rows] = await connection.query('SELECT ai_balance FROM users WHERE `token` = ?', [auth]);

        if (rows.length === 0) {
            return res.status(200).json({
                message: 'Failed',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }

        const ai_balance = rows[0].ai_balance;

        return res.status(200).json({
            message: 'Success',
            status: true,
            ai_balance: ai_balance,
            timeStamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error fetching AI balance:', error);
        return res.status(500).json({
            message: 'Internal server error',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }
}; 

const attendanceBonus = async (req, res) => {
    let auth = req.cookies.auth;
    const [user] = await connection.query('SELECT `id`, `phone`, `code`, `invite` FROM users WHERE `token` = ?', [auth]);
    let userInfo = user[0];
    if (!userInfo) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }

    const currentDate = new Date();
    const currentDateString = currentDate.toISOString().split('T')[0];

    const [attendanceResult] = await connection.query('SELECT attendance FROM users WHERE phone = ?', [userInfo.phone]);
    let attendance = attendanceResult[0].attendance;

    if (attendance >= 7) {
        return res.status(200).json({
            message: 'Failed as you have already claimed all attendance bonus',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }

    if (attendance === 0) {
        const [sumResult] = await connection.query('SELECT SUM(money) as sumOfRecharge FROM recharge WHERE phone = ? AND today = ?', [userInfo.phone, currentDateString]);
        let sumOfRecharge = sumResult[0].sumOfRecharge || 0;

        return checkAttendanceBonusRules(userInfo.phone, attendance + 1, sumOfRecharge, res);
    } else {
        const [lastBonusResult] = await connection.query('SELECT DATE(created_at) as lastBonusDate FROM incomes WHERE remarks = "Attendance Bonus" AND user_id = ? ORDER BY created_at DESC LIMIT 1', [userInfo.id]);
        if (lastBonusResult.length > 0) {
            let lastBonusDate = new Date(lastBonusResult[0].lastBonusDate);
            let dateDifference = Math.floor((currentDate - lastBonusDate) / (1000 * 60 * 60 * 24));

            if (dateDifference === 1) {
                const [sumResult] = await connection.query('SELECT SUM(money) as sumOfRecharge FROM recharge WHERE phone = ? AND today = ?', [userInfo.phone, currentDateString]);
                let sumOfRecharge = sumResult[0].sumOfRecharge || 0;

                return checkAttendanceBonusRules(userInfo.phone, attendance + 1, sumOfRecharge, res);
            } else {
                return res.status(200).json({
                    message: 'Failed as not claimed daily',
                    status: false,
                    timeStamp: new Date().toISOString(),
                });
            }
        } else {
            return res.status(200).json({
                message: 'No previous attendance bonus record found',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }
    }
};

const checkAttendanceBonusRules = async (phone, attendance, sumOfRecharge, res) => {
    let bonus = 0;

    // Define the bonus based on attendance and sum of recharge
    if (attendance == 1 && sumOfRecharge >= 300) {
        bonus = 7;
    } else if (attendance == 2 && sumOfRecharge >= 1000) {
        bonus = 20;
    } else if (attendance == 3 && sumOfRecharge >= 3000) {
        bonus = 100;
    } else if (attendance == 4 && sumOfRecharge >= 8000) {
        bonus = 200;
    } else if (attendance == 5 && sumOfRecharge >= 20000) {
        bonus = 450;
    } else if (attendance == 6 && sumOfRecharge >= 80000) {
        bonus = 2400;
    } else if (attendance == 7 && sumOfRecharge >= 200000) {
        bonus = 6400;
    }

    if (bonus === 0) {
        return res.status(200).json({
            message: 'Failed as Attendance Rules not met',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }

    // Insert data into incomes table
    const sql = `INSERT INTO incomes (user_id, amount, comm, remarks, rname) VALUES ((SELECT id FROM users WHERE phone = ?), ?, ?, ?, ?)`;
    await connection.execute(sql, [phone, sumOfRecharge, bonus, 'Attendance Bonus', phone]);

    // Update the user's balance and attendance in users table
    const updateUserSql = `UPDATE users SET money = money + ?, attendance = ? WHERE phone = ?`;
    await connection.execute(updateUserSql, [bonus, attendance, phone]);

    return res.status(200).json({
        message: 'Attendance bonus processed successfully',
        status: true,
        timeStamp: new Date().toISOString(),
    });
};

const getAttendanceInfo = async (req, res) => {
    let auth = req.cookies.auth;
    const [user] = await connection.query('SELECT `id`, `phone`, `code`, `invite`, `attendance` FROM users WHERE `token` = ?', [auth]);
    let userInfo = user[0];
    if (!userInfo) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }

    const [sumResult] = await connection.query('SELECT SUM(comm) as accumulatedBonus FROM incomes WHERE remarks = "Attendance Bonus" AND user_id = ?', [userInfo.id]);
    let accumulatedBonus = sumResult[0].accumulatedBonus || 0;

    return res.status(200).json({
        message: 'Attendance info fetched successfully',
        status: true,
        attendanceDays: userInfo.attendance,
        accumulatedBonus: accumulatedBonus,
        timeStamp: new Date().toISOString(),
    });
};


const calculateTeamRecharge = async () => {
    const currentDate = new Date();
    const yesterday = new Date(currentDate);
    yesterday.setDate(currentDate.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];

    // Get all users
    const [users] = await connection.query('SELECT `id`, `phone`, `code` FROM users');

    for (let user of users) {
        const userCode = user.code;

        // Get all team members for the user
        const [teamMembers] = await connection.query('SELECT `phone` FROM users WHERE `invite` = ?', [userCode]);

        let count = 0;
        let totalRecharge = 0;

        for (let member of teamMembers) {
            const memberPhone = member.phone;

            // Check if the member did a recharge yesterday
            const [rechargeResult] = await connection.query('SELECT COUNT(*) as rechargeCount, SUM(money) as totalRecharge FROM recharge WHERE `phone` = ? AND `today` = ?', [memberPhone, yesterdayString]);
            const rechargeCount = rechargeResult[0].rechargeCount;
            const memberRecharge = rechargeResult[0].totalRecharge || 0;

            if (rechargeCount > 0) {
                count++;
                totalRecharge += memberRecharge;
            }
        }

        // Call salaryBonus function with the total recharge and count
        await salaryBonus(totalRecharge, count, user.phone);
    }
};

// Function to handle salary bonus calculation and update
const salaryBonus = async (sumOfRecharge, count, phone) => {
    let bonus = 0;

    // Define the bonus based on count and sum of recharge
    if (count >= 5 && count < 10 && sumOfRecharge >= 10000 && sumOfRecharge < 20000) {
        bonus = 500;
    } else if (count >= 10 && count < 20 && sumOfRecharge >= 20000 && sumOfRecharge < 30000) {
        bonus = 1000;
    } else if (count >= 20 && count < 30 && sumOfRecharge >= 30000 && sumOfRecharge < 40000) {
        bonus = 1500;
    } else if (count >= 30 && count < 50 && sumOfRecharge >= 40000 && sumOfRecharge < 50000) {
        bonus = 2000;
    } else if (count >= 50 && count < 100 && sumOfRecharge >= 50000 && sumOfRecharge < 100000) {
        bonus = 2500;
    } else if (count >= 100 && count < 300 && sumOfRecharge >= 100000 && sumOfRecharge < 200000) {
        bonus = 5000;
    } else if (count >= 300 && count < 500 && sumOfRecharge >= 200000 && sumOfRecharge < 500000) {
        bonus = 10000;
    } else if (count >= 500 && count < 1000 && sumOfRecharge >= 500000 && sumOfRecharge < 1000000) {
        bonus = 25000;
    } else if (count >= 1000 && count < 3000 && sumOfRecharge >= 1000000 && sumOfRecharge < 3000000) {
        bonus = 50000;
    } else if (count >= 3000 && sumOfRecharge >= 3000000) {
        bonus = 100000;
    }

    // Insert bonus into incomes table if applicable
    if (bonus > 0) {
        const sql = `INSERT INTO incomes (user_id, amount, comm, remarks, rname) VALUES ((SELECT id FROM users WHERE phone = ?), ?, ?, ?, ?)`;
        await connection.execute(sql, [phone, sumOfRecharge, bonus, 'Daily Salary Bonus', 0]);

        // // Update the user's balance
        // const updateUserSql = `UPDATE users SET money = money + ? WHERE phone = ?`;
        // await connection.execute(updateUserSql, [bonus, phone]);
    }
};

const calculateDailyEarnings = async () => {
    try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0)).getTime();
        const endOfYesterday = new Date(yesterday.setHours(23, 59, 59, 999)).getTime();

        const [users] = await connection.query('SELECT `id`, `phone` FROM users');

        for (let user of users) {
            const { id, phone } = user;

            // Sum money from minutes_1 table
            const [minutes1Result] = await connection.query(
                'SELECT SUM(money) as sumMoney FROM minutes_1 WHERE phone = ? AND time BETWEEN ? AND ?',
                [phone, startOfYesterday, endOfYesterday]
            );
            const sumMinutes1 = minutes1Result[0].sumMoney || 0;

            // Sum money from result_k3 table
            const [resultK3] = await connection.query(
                'SELECT SUM(money) as sumMoney FROM result_k3 WHERE phone = ? AND time BETWEEN ? AND ?',
                [phone, startOfYesterday, endOfYesterday]
            );
            const sumResultK3 = resultK3[0].sumMoney || 0;

            // Sum money from result_5d table
            const [result5d] = await connection.query(
                'SELECT SUM(money) as sumMoney FROM result_5d WHERE phone = ? AND time BETWEEN ? AND ?',
                [phone, startOfYesterday, endOfYesterday]
            );
            const sumResult5d = result5d[0].sumMoney || 0;

            const totalSum = sumMinutes1 + sumResultK3 + sumResult5d;

            if (totalSum > 0) {
                // Calculate the bonus
                const bonus = totalSum * 0.003;

                // Insert data into incomes table
                const sql = `INSERT INTO incomes (user_id, amount, comm, remarks, rname) VALUES (?, ?, ?, ?, ?)`;
                await connection.execute(sql, [id, totalSum, bonus, 'Trading Bonus', phone]);

                // Update the user's balance in users table
                const updateUserSql = `UPDATE users SET money = money + ? WHERE phone = ?`;
                await connection.execute(updateUserSql, [bonus, phone]);

                console.log(`User phone: ${phone}, Total sum: ${totalSum}, Bonus: ${bonus}`);
            }
        }
    } catch (error) {
        console.error('Error calculating daily earnings:', error);
    }
};

const listIncomeReport = async (req, res) => {
    let auth = req.cookies.auth;
    if (!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }

    const [user] = await connection.query('SELECT `id`, `phone` FROM users WHERE `token` = ?', [auth]);
    if (!user.length) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }

    let userId = user[0].id;

    const [incomeReports] = await connection.query(
        `SELECT updated_at, comm, remarks 
         FROM incomes 
         WHERE user_id = ? 
         AND remarks != 'Ai bonus' 
         AND (remarks != 'Daily Salary Bonus' OR (remarks = 'Daily Salary Bonus' AND rname != '0'))
         ORDER BY updated_at DESC`, 
        [userId]
    );

    return res.status(200).json({
        message: 'Receive success',
        incomeReports: incomeReports,
        status: true,
        timeStamp: new Date().toISOString(),
    });
};

const insertStreakBonus = async (req, res) => {
    const auth = req.cookies.auth;
    const { userId, number, periods } = req.body;
    const timeNow = new Date().toISOString();

    if (!auth || !userId || !number || !periods) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    }

    try {
        const [user] = await connection.query('SELECT phone, id FROM users WHERE id_user = ?', [userId]);

        if (user.length === 0) {
            return res.status(200).json({
                message: 'Invalid user ID',
                status: false,
                timeStamp: timeNow,
            });
        }

        const phone = user[0].phone;
        const userIdInUsers = user[0].id;

        if (number < 5) {
            return res.status(200).json({
                message: 'Streak must be at least 5',
                status: false,
                timeStamp: timeNow,
            });
        }

        let amount = 0;
        let bonus = 0;

        if (number >= 5 && number < 10) {
            amount = 50;
            bonus = 50;
        } else if (number >= 10 && number < 15) {
            amount = 1000;
            bonus = 1000;
        } else if (number >= 15 && number < 20) {
            amount = 5000;
            bonus = 5000;
        } else if (number >= 20 && number < 25) {
            amount = 10000;
            bonus = 10000;
        } else if (number >= 25) {
            amount = 20000;
            bonus = 20000;
        }

        const sql = `INSERT INTO streak_bonus SET 
            phone = ?, 
            user_id = ?, 
            streak_number = ?, 
            streak_period_number = ?, 
            amount = ?, 
            bonus = ?, 
            status = 0, 
            created_at = ?, 
            updated_at = ?`;

        await connection.execute(sql, [phone, userId, number, periods, amount, bonus, timeNow, timeNow]);

        return res.status(200).json({
            message: 'Streak bonus inserted successfully',
            status: true,
            timeStamp: timeNow,
        });
    } catch (error) {
        console.error('Error inserting streak bonus:', error);
        return res.status(500).json({
            message: 'Internal Server Error',
            status: false,
            timeStamp: timeNow,
        });
    }
}

const listStreakBonusReport = async (req, res) => {
    let auth = req.cookies.auth;
    if (!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }

    const [user] = await connection.query('SELECT `phone` FROM users WHERE `token` = ?', [auth]);
    if (!user.length) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }

    let userPhone = user[0].phone;

    const [streakBonuses] = await connection.query(
        'SELECT `updated_at`, `amount`, `status` FROM streak_bonus WHERE `phone` = ? ORDER BY `updated_at` DESC', 
        [userPhone]
    );

    return res.status(200).json({
        message: 'Receive success',
        streakBonuses: streakBonuses,
        status: true,
        timeStamp: new Date().toISOString(),
    });
};

const getVipDetails = async (req, res) => {
    let auth = req.cookies.auth;
    if (!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }

    try {
        const [user] = await connection.query('SELECT `id`, `experience`, `vip_level` FROM users WHERE `token` = ?', [auth]);
        let userInfo = user[0];
        if (!userInfo) {
            return res.status(200).json({
                message: 'Failed',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }

        const [levelUpBonuses] = await connection.query(
            'SELECT amount, id, rname FROM incomes WHERE remarks = "Level Up Bonus" AND user_id = ?',
            [userInfo.id]
        );

        const numberOfRows = levelUpBonuses.length;

        return res.status(200).json({
            message: 'VIP details fetched successfully',
            status: true,
            experience: userInfo.experience,
            vip_level: userInfo.vip_level,
            levelUpBonuses: levelUpBonuses,
            numberOfRows: numberOfRows,
            timeStamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Internal Server Error',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }
};


const claimLevelUpBonus = async (req, res) => {
    let auth = req.cookies.auth;
    let id = req.body.id;

    if (!auth || !id) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }

    try {
        const [user] = await connection.query('SELECT id FROM users WHERE token = ?', [auth]);
        if (user.length === 0) {
            return res.status(200).json({
                message: 'Failed',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }
        const userId = user[0].id;

        const [income] = await connection.query('SELECT amount, rname, user_id FROM incomes WHERE id = ?', [id]);
        if (income.length === 0) {
            return res.status(200).json({
                message: 'Invalid bonus ID',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }

        const { amount, rname, user_id } = income[0];

        if (userId !== user_id) {
            return res.status(200).json({
                message: 'Unauthorized',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }

        if (rname === 1) {
            return res.status(200).json({
                message: 'Bonus Already claimed',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }

        await connection.query('UPDATE incomes SET rname = 1 WHERE id = ?', [id]);
        await connection.query('UPDATE users SET money = money + ? WHERE id = ?', [amount, user_id]);

        return res.status(200).json({
            message: 'Bonus claimed successfully',
            status: true,
            timeStamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Internal Server Error',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }
};

const vipHistory = async (req, res) => {
    let auth = req.cookies.auth;
    if (!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }

    const [user] = await connection.query('SELECT `id`, `phone`, `code`, `invite` FROM users WHERE `token` = ?', [auth]);
    let userInfo = user[0];
    if (!userInfo) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }

    const [history] = await connection.query(
        'SELECT updated_at, amount FROM incomes WHERE remarks IN ("Level Up Bonus", "Monthly VIP Bonus") AND user_id = ? ORDER BY updated_at DESC',
        [userInfo.id]
    );

    return res.status(200).json({
        message: 'Get success',
        datas: history,
        status: true,
        timeStamp: new Date().toISOString(),
    });
};


const monthlyVipBonus = async () => {
    try {
        // Select all users
        const [users] = await connection.query('SELECT id, phone, vip_level FROM users');

        for (const user of users) {
            if (user.vip_level !== 0) {
                // Select monthly_reward from vip_rules where vip_level matches user's vip_level
                const [vipRule] = await connection.query(
                    'SELECT monthly_reward FROM vip_rules WHERE vip_level = ?',
                    [user.vip_level]
                );

                if (vipRule.length > 0) {
                    const monthlyReward = vipRule[0].monthly_reward;

                    // Update money in users table
                    await connection.query(
                        'UPDATE users SET money = money + ? WHERE id = ?',
                        [monthlyReward, user.id]
                    );

                    // Insert into incomes
                    const sql = `
                        INSERT INTO incomes (user_id, amount, comm, remarks, rname, created_at, updated_at)
                        VALUES (?, ?, ?, "Monthly VIP Bonus", ?, NOW(), NOW())
                    `;
                    await connection.query(sql, [user.id, monthlyReward, monthlyReward, user.phone]);
                }
            }
        }

        console.log('Monthly VIP bonuses distributed successfully');
    } catch (error) {
        console.error('Error distributing monthly VIP bonuses:', error);
    }
};


module.exports = {
    userInfo,
    changeUser,
    promotion, 
    myTeam,
    recharge,
    rechargeCoin,
    createPayment,
    recharge2,
    checkRechargeStatus,
    listRecharge,
    listWithdraw,
    changePassword,
    checkInHandling,
    infoUserBank,
    addBank,
    withdrawal3,
    withdrawal4,
    callback_bank,
    listMyTeam,
    verifyCode,
    useRedenvelope,
    search,
    listMyInvation,
    listMyRebate,
    claimInterest,
    manualRecharge,
    fundTransfer,
    fundTransferGame,
    listFundTransferReport,
    listGameTransferReport,
    listStreakBonusReport,
    getAIBonus,
    getAIBalance,
    attendanceBonus,
    getAttendanceInfo,
    calculateTeamRecharge,
    calculateDailyEarnings,
    listIncomeReport,
    createPayment1,
    handlePlisioCallback,
    insertStreakBonus,
    getVipDetails,
    claimLevelUpBonus,
    vipHistory,
    monthlyVipBonus
}
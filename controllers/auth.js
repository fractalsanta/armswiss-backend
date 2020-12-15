const mysql = require("mysql");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const utils = require('../utils.js');
const db = utils.createDBConnection();

const eventController = require('../controllers/events-log');

exports.login = async (req,res) => {
    try {

        const { email, password } = req.body;
        console.log(email);
        if(!email || !password) {
            return res.status(400).json({
                error: 'Please provide both an email and password'
            });
        }

        db.query(`SELECT * FROM users WHERE email = ?`,[email], async (error,results) => {
            console.log("SQL QUERY LOG" , results);
            if (error) throw error;
            
            
            else if (!results.length || !(await bcrypt.compare(password, results[0].password))) {
                console.log("comparison failed");

                //Log the event
                eventController.logEvent("failedlogin", req.body.email + " failed to log in", req.body.email);
                return res.json({
                    message: 'Email or password is incorrect',
                    status: 401
                });

            }
            else if (!results[0].emailActive) {
                console.log("email is inactive");
                return res.json({
                    message: 'This email is currently inactive',
                    status: 401
                })
            }
            //First check, has the user logged in before and second, has the account been verified
            else if (!results[0].lastLogin || results[0].verified != 1) {
                console.log("User has not logged in before");
                const token = jwt.sign({ id: results[0].id, email: results[0].email }, 'supersecret', {expiresIn: '20m'});
                return res.json({
                    message: 'Verification required. Click OK to verify this Email',
                    verification: true,
                    token: token,
                    userResponse: results[0]
                })
            }
            //
            else {
                console.log("comparison passed");
                //UPDATE LAST LOGIN
                let currDateTime = Date.now();
                db.query(`UPDATE users SET lastLogin = '${currDateTime}' WHERE email = '${results[0].email}'`, (error, res) => {

                    if(!res) {
                        console.log(error)
                    }
                    
                });

                //Log the event
                eventController.logEvent("login", req.body.email + " has logged in", req.body.email);

                
                //JWT TOKEN
                const id = results[0].id;
                const role = results[0].role;
                const firstName = results[0].firstName;
                const lastName = results[0].lastName;
                const phone = results[0].phone;
                const email = results[0].email;
                const lastLogin = results[0].lastLogin;
                const token = jwt.sign({ id: id, firstName: firstName, lastName: lastName, phone: phone, email: email, role: role }, 'supersecret');
                const userResponse = { id: results[0].id, firstName: results[0].firstName, lastName: results[0].lastName, phone: results[0].phone, email: results[0].email, role: role, lastLogin: results[0].lastLogin, verified: results[0].verified }
                console.log("date: " + currDateTime);
                console.log("token is: " + token);
                console.log("user is: " + userResponse);
                return res.json(userResponse)
            }
            


        })
    } catch(error) {
        console.log(error);
    }
}
exports.sendotp = async(req, res) => {
    var otpGenerator = require('otp-generator')
    const otp = otpGenerator.generate(6, { upperCase: false, specialChars: false });
    utils.sendOTPEmail(req.body, otp);
    //Log the event
    eventController.logEvent("otpsent", "OTP sent to user email", req.body.email);

    db.query(`UPDATE users SET otp = '${otp}' WHERE email = '${req.body.email}'`, (error, result) => {
        if(error) {
            console.log(error)
        } else {
            return res.status(200).json({
                success: 'User registered'
            })
        }  
        
    });
    
}

exports.verifyotp = async(req, res) => {
    var sql = `SELECT * FROM users WHERE email = '${req.body.email}' AND otp = '${req.body.otp}'`;
    console.log(sql);
    db.query(sql, function (err, result) {
        if (err) throw err;
        else if (!result.length) {
            return res.status(200).json({
                success: false,
                error: 'Could not validate OTP for this account'
            });
        }
       
        else {
            console.log('about to verify '+req.body.email)
            let currDateTime = Date.now()
            let userResponse = result[0]
            db.query(`UPDATE users set verified = '1', lastLogin = '${currDateTime}' where email = '${req.body.email}'`, function (err, results) {
                if(err) throw err;
                if(results) {
                    userResponse.verified = 1;
                    return res.status(200).json({
                        success: true,
                        message: "OTP validation successful",
                        userResponse: result[0]
                    });
                }
                
            })
            
        }
    });
    
}

exports.register = async (req,res) => {
    try {
        console.log('attempt to register')
        const { firstName, lastName, phone, password, email } = req.body;
        
        let hashedPassword = await bcrypt.hash(password, 8);
        let accountId = '1185106000019416001'; //this will be set from zoho account id that the user belongs to
        console.log(hashedPassword);
        db.query(`UPDATE users SET ? WHERE email = '${email}'`, {email: email, password: hashedPassword, accountId: accountId, firstName: firstName, lastName: lastName, phone: phone, emailActive: '1' }, (error) => {
            if(error) {
                console.log(error)
            } else {
                return res.status(200).json({
                    success: 'User registered'
                })
            }  
            
        });
    } catch(error) {
        console.log(error);
    }
}



exports.update = async (req,res) => {
    try {

        const { firstName, lastName, phone, password, email } = req.body;
        const emailId = req.body.email;

        db.query(`UPDATE users SET ? WHERE email = '${emailId}'`, { firstName: firstName, lastName: lastName, phone: phone }, (error) => {
            
            if(error) {
                console.log(error)
            } else {
                return res.status(200).json({
                    success: 'User modified'
                })
            }  
            
        });
    } catch(error) {
        console.log(error);
    }
}

exports.forgot = async (req,res) => {
    try {

        const { email, password } = req.body;
        
        let hashedPassword = await bcrypt.hash(password, 8);
        let accountId = '1185106000019416001'; //this will be set from zoho account id that the user belongs to
        db.query('INSERT INTO users SET ?', {email: email, password: hashedPassword, accountId: accountId }, (error) => {
            if(error) {
                console.log(error)
            } else {
                return res.status(200).json({
                    message: 'User registered'
                })
            }  
            
        });
    } catch(error) {
        console.log(error);
    }
}


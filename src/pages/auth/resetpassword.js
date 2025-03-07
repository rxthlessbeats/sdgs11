import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom'
import './auth.css';
import Load from '../global/load';
import Invalid from '../global/invalid';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { solid } from '@fortawesome/fontawesome-svg-core/import.macro' // <-- import styles to be used

function ResetPasswordPage() {
    const [loading, setLoading] = useState(true);
    const [password, setPassword] = useState('')
    const {token} = useParams();
    const [valid, setValid] = useState(true);

    const verifyToken = useCallback(async () => {
        if (token) {
            const url = `https://sdgs12.herokuapp.com/api/verify/${token}`
            console.log(url);
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
            })
            const data = await response.json();
            if(data.status === 'ok'){
                setLoading(false)
                return;
            }
        }
        setValid(false);  
        setLoading(false);
    }, [token]);

    useEffect(() => {
        verifyToken();
    }, [verifyToken])

    async function resetPassword(event){
		event.preventDefault();
        console.log(token);
        console.log(password);
		const response = await fetch('https://sdgs12.herokuapp.com/api/resetPassword', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				token,
                password,
			}),
		})
        const data = await response.json();
        if(data.error) {
            alert(data.error);
            setValid(false);
        } else {
            alert('Password Reset Successfully');
            window.location.href = '/login';
        }
	}

    if(loading) return <Load/>;
    if(!valid) return <Invalid/>;
	return (
        <div className='AuthPage'>
            <div className='header'>
                <h1>忘記密碼</h1>
            </div>
            <div className="container">
                <div>
                    <h1>忘記密碼</h1>
                    <form onSubmit={resetPassword}>
                        <div className='box'>
                            <FontAwesomeIcon className="gradient" icon={solid("lock")}/>
                            <input 
                                className='inp'
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                id="new-password"
                                autoComplete="new-password"
                                placeholder='輸入密碼'>
                            </input>
                        </div>
                        <input className='submit-button' type="submit" value="更新密碼"></input>
                    </form>
                </div>
            </div>
            
        </div>
	)
}

export default ResetPasswordPage;
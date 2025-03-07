import React, { useEffect, useState } from 'react';
import './profile.css';
import jwtDecode from 'jwt-decode'
import Navbar from '../global/navbar';
import Load from '../global/load';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { solid } from '@fortawesome/fontawesome-svg-core/import.macro' // <-- import styles to be used

function ProfilePage() {
	const [loading, setLoading] = useState(true);
	const [signIn, setSignIn] = useState(false);
	const [user, setUser] = useState({});
	const [userImg, setUserImg] = useState();
	const [backgroundImg, setBackgroundImg] = useState();
	const [userImgList, setUserImgList] = useState([]);
	const [backgroundImgList, setBackgroundImgList] = useState([]);
	const [showUIL, setShowUIL] = useState(false);
	const [showBIL, setShowBIL] = useState(false);
	const [UIchoice, setUIchoice] = useState(0);
	const [BIchoice, setBIchoice] = useState(0);
	const [changed, setChanged] = useState(false);
	const [finishedSpots, setFinishedSpots] = useState(0);
	const [finishedPaths, setFinishedPaths] = useState(0)

	async function getUser() {
		console.log("Get User Data");
        const req = await fetch ('https://sdgs12.herokuapp.com/api/user', {
            method: 'GET',
            headers: {
                'x-access-token': localStorage.getItem('token')
            }
        });
        const data = await req.json();
        if(data.status === 'ok') setUser(data.user);
        else alert(data.error);
		
		// GET USER IMG lIST
		var tempUserImgList = [];
		for(var i=1; i<=6; i++) {
			try {
				tempUserImgList.push(require('../../images/user/' + i + '.png'));
			} catch (err) {
				console.log(err);
			}
		}
		setUserImgList(tempUserImgList);

		// GET BACKGROUND IMG LIST
		console.log("Fetch SpotData");
        const response = await fetch('https://sdgs12.herokuapp.com/api/all', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data2 = await response.json();
        if(data.status === 'fail'){
            console.log("Failed to get spots");
            return;
        };
        const spotData = data2.spotData;
        var tempBackgroundImgList = [];
        for(i in spotData){
            try{
                tempBackgroundImgList.push(require('../../images/spot/'+spotData[i].name+'.jpg'));
            } catch (err) {
                tempBackgroundImgList.push(require('../../images/spot/image-not-found.jpg'));
            }
        }
		setBackgroundImgList(tempBackgroundImgList);

		// FINISHED SPOTS
		// const response3 = await fetch('https://sdgs12.herokuapp.com/api/finished', {
		// 	method: 'GET',
		// 	headers: {
		// 		'x-access-token': localStorage.getItem('token')
		// 	}
		// });
		// const data3 = await response3.json();
		// // var tempfinish = 0;
		// if(data3.status === 'fail') {
		// 	console.log("Failed to Set Finished");
		// } else {
		// 	const finishedData = data3.finishedData; // all the spots you visited
		// 	setFinishedSpots(finishedData.length);
		// }
		// FINISHED PATHS
		const response3 = await fetch('https://sdgs12.herokuapp.com/api/pathFinish', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'x-access-token': localStorage.getItem('token')
			},
		})
		const data3 = await response3.json();
		if(data3.status === 'fail'){
			console.log(data.error);
			return;
		}
		const spotPath = data3.spotPath; 
		const userSpot = data3.userSpot;
	
		// // Make spsotPathList
		var spotPathList = new Map();
		var newlist;
		for(i in spotPath){
			if(spotPathList.has(spotPath[i].pathID)){
				newlist = spotPathList.get(spotPath[i].pathID);
			}else{
				newlist = [];
			}
			newlist.push(spotPath[i].spotID);
			spotPathList.set(spotPath[i].pathID, newlist);
		}
		console.log(spotPathList);
	
		// make userhas 
		var userhas = [];
		for(i in userSpot){
			userhas.push(userSpot[i].spotID);
		}
		console.log(userhas);
		setFinishedSpots(userhas.length);

		// compare
		var tempfinish = 0;
		for(i=1; i<=5; i++) {
			if(spotPathList.get(i).every(val => userhas.includes(val))){
				tempfinish++;
			}
		}
		setFinishedPaths(tempfinish);
		setLoading(false);
    }

	useEffect(() => {
		const token = localStorage.getItem('token');
		if (token) {
			const user = jwtDecode(token);
			console.log(user);
			if(!user){
			  alert("Token Invalid")
			  localStorage.removeItem('token'); 
			  setBackgroundImg(require('../../images/spot/image-not-found.jpg'));
			  setUserImg(require('../../images/user/image-not-found.png'));
			  setLoading(false); 
			}else{
			  setSignIn(true);
			  getUser();
			}
		} else {
			setBackgroundImg(require('../../images/spot/image-not-found.jpg'));
			setUserImg(require('../../images/user/image-not-found.png'));
			setLoading(false);
			alert("登入以取得資料")
		} 
	}, [])

	useEffect(() => {
		// userImg // backgroundImg
		if(userImgList.length === 0) return;
		if(backgroundImgList.length === 0) return;
		setUserImg(userImgList[user.userimg]);
		setBackgroundImg(backgroundImgList[user.bgimg]);
		setUIchoice(user.userimg);
		setBIchoice(user.bgimg);
	}, [user.userimg, user.bgimg, userImgList, backgroundImgList])

	const setBIL = async () => {
		console.log(BIchoice);
		setChanged(false);
		const response = await fetch('https://sdgs12.herokuapp.com/api/chooseImg', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				user,
				BIchoice,
				type: 0,
			}),
		})
		const data = await response.json();
        if(data.error) {
            alert(data.error);
        } else {
            alert('Background Image Saved Successfully');
        }
	}

	const setUIL = async () => {
		console.log(UIchoice);
		setChanged(false);
		const response = await fetch('https://sdgs12.herokuapp.com/api/chooseImg', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				user,
				UIchoice,
				type: 1,
			}),
		})
		const data = await response.json();
        if(data.error) {
            alert(data.error);
        } else {
            alert('Avatar Image Saved Successfully');
        }
	}
	 


	if(loading) return <Load/>;
	return (
		<div className='ProfilePage'>
			{signIn ? (
				<div>
					<div className='header'>
						<h1>會員資料</h1>
					</div>
					<Navbar/>
					<div className="container">
						<div className='bgimg-container' onClick={() => {
								if(!showBIL) {
									if(showUIL && changed) {
										setUIL();
										setShowUIL(false);
									}
									setShowBIL(true);
								} 
							}}>
							<img src={backgroundImg} alt="圖片"></img>
						</div>
						<div className='userimg-container' onClick={() => {
								if(!showUIL) {
									if(showBIL && changed) {
										setBIL();
										setShowBIL(false);
									}
									setShowUIL(true);
								}
							}}>
							<img src={userImg} alt="圖片"></img>
						</div>
						<h1 className='name'>{user.username}</h1>
						<div className='box-left'>
							<h2>完成的路徑</h2>
							<h3>{finishedPaths}</h3>
						</div>
						<div className='box-right'>
							<h2>領取的地點</h2>
							<h3>{finishedSpots}</h3>
						</div>
						<div className='info'>
							<h4>帳號: {user.email}</h4>
							{user.studentID &&<h4>學號: {user.studentID}</h4>}
						</div>
					</div>
					{showBIL?
						<div className='choose-container'>
							<div className='cancel'>
							<FontAwesomeIcon icon={solid('x')} onClick={() => {
									setShowBIL(false);
									if(changed) setBIL();
								}} /></div>
							<h1>選擇要更換的背景</h1>
							{backgroundImgList.map((bgimg, id) => {
								return(
									<img key={id} className='bgimg' src={bgimg} alt="背景" onClick={() => {
										if(BIchoice !== id) {
											setBackgroundImg(backgroundImgList[id]);
											setBIchoice(id);
											setChanged(true);
										}
									}}></img>
								)
							})}
						</div>
						:
						<div className='choose-container hide-container'></div>
					}
					{showUIL? 
						<div className='choose-container'>
							<div className='cancel'>
								<FontAwesomeIcon icon={solid('x')} onClick={() => {
									setShowUIL(false);
									if(changed) setUIL();
								}}/>
							</div>
							<h1>選擇要更換的頭貼</h1>
							{userImgList.map((userimg, id) => {
								return (
									<img key={id} className='userimg' src={userimg} alt="頭貼" onClick={() => {
										if(UIchoice !== id) {
											setUserImg(userImgList[id]);
											setUIchoice(id);
											setChanged(true);
										}
									}}></img>
								)
							})}
							<a href="https://www.flaticon.com/free-icons/person" title="person icons">Person icons created by Freepik - Flaticon</a>
						</div>
						:
						<div className='choose-container hide-container'></div>
					}
				</div>
				) : (
				<div>
					<div className='header'>
						<h1>會員資料</h1>
					</div>
					<Navbar/>
					<div className="container">
						<div className='bgimg-container'>
							<img src={backgroundImg} alt="圖片"></img>
						</div>
						<div className='userimg-container'>
							<img src={userImg} alt="圖片"></img>
						</div>
						<h1 className='name'>使用者名稱</h1>
						<div className='box-left'>
							<h2>完成的路徑</h2>
							<h3>0</h3>
						</div>
						<div className='box-right'>
							<h2>走過的地點</h2>
							<h3>0</h3>
						</div>
					</div>
				</div>
				)
			} 
		</div>
	)
}

export default ProfilePage
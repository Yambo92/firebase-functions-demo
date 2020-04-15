const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
//auth trigger (new user signup)
exports.newUserSignup = functions.auth.user().onCreate((user) => {
    // console.log('user created', user.email, user.uid);
    //Function returned undefined, expected Promise or value
    return admin.firestore().collection('users').doc(user.uid).set({
        email: user.email,
        upvotedOn: []
    });
    
})

//auth trigger (user deleted)
exports.userDeleted = functions.auth.user().onDelete((user) => {
    // console.log('user deleted', user.email, user.uid);
    //Function returned undefined, expected Promise or value
    const doc = admin.firestore().collection('users').doc(user.uid);
    return doc.delete();
    
});

//http callable function (adding a request)
exports.addRequest = functions.https.onCall((data, context) => {
    if(!context.auth){
        throw new functions.https.HttpsError(
            'unauthenticated', 
            'only authentaicated user can add requests.'
        );
    } else if(data.ct.length > 30){
        throw new functions.https.HttpsError(
            'invalid-argument',
            'request must be no more than 30 characters long.'
        )
    } else {
         admin.firestore().collection('requests').add({
            text: data.ct,
            upvotes: 0
        }).then((result) => {
            return result
            
        }).catch(error => console.log(error.message))
    }
})

// upvote callable function
exports.upvote = functions.https.onCall(( data, context) => {
    //check auth
    if(!context.auth){
        throw new functions.https.HttpsError(
            'unauthenticated', 
            'only authentaicated user can add vote.'
        );
    }

    // get refs for user doc & request doc
    const user = admin.firestore().collection('users').doc(context.auth.uid);
    const request = admin.firestore().collection('requests').doc(data.id);

    return user.get().then(doc => {
        //check user hasn't already upvoted the request
        if(doc.data().upvotedOn.includes(data.id)){
            throw new functions.https.HttpsError(
                "failed-precondition", 
                'you can only upvote something once'
            )
        }
        //update user array
        return user.update({
            upvotedOn: [...doc.data().upvotedOn, data.id]
        })
        .then(() => {
            //update votes on the request
            return request.update({
                //把当前这个request里的upvotes字段的值增1；
                upvotes: admin.firestore.FieldValue.increment(1)
            })
        })
    })
})




// //http request 1
// exports.randomNumber = functions.https.onRequest((request, response) => {
//     const number = Math.round(Math.random() * 100);
//     response.send(number.toString());
// })

// //http request 2
// exports.toTheDojo = functions.https.onRequest((request, response) => {
//     response.redirect('https://yambo-firestore-tut.web.app/')
// });

// //http callable function
// exports.sayHello = functions.https.onCall((data, context) => {
//     const name = data.name;
//     return `hello , ${name}`
// })

/* eslint-disable react-hooks/exhaustive-deps */
import {collection, doc, getDoc, getDocs, increment, writeBatch } from 'firebase/firestore';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { authModalState } from '../atoms/authModalAtom';
import { Community, CommunitySnippet, communityState } from '../atoms/communitiesAtom';
import { auth, firestore } from '../firebase/clientApp';

const useCommunityData = () => {

    const [communityStateValue, setCommunityStateValue] = useRecoilState(communityState);
    const [user] = useAuthState(auth);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const setAuthModalState = useSetRecoilState(authModalState);
    const router = useRouter();
    const onJoinOrLeaveCommunity = (communityData:  Community, isJoined:boolean) => {
        // is the user signed in ?
            // if not => open auth modal

            if(!user){
                //open modal
                setAuthModalState({ open: true, view: "login"});
                return;
            }

        if(isJoined) {
            leaveCommunity(communityData.id);
            return;
        }
        joinCommunity(communityData);
    };

    const getMySnippets = async () => {
        setLoading(true);
        try{
            //get users snippets
            const snippetDocs = await getDocs(collection(firestore, `users/${user?.uid}/communitySnippets`)
            );

            const snippets = snippetDocs.docs.map((doc)=> ({...doc.data()}));
            setCommunityStateValue(prev => ({
                ...prev, 
                mySnippets: snippets as CommunitySnippet[],
                snippetsFetched: true
            }))
            console.log('here are snippets', snippets);
        
        }catch (error: any){
            console.log('getMySnippets error', error);
        }
        setLoading(false);
    };

    const joinCommunity = async (communityData: Community) => {

        // batch write  
        // updating the number of members
        try{
            const batch = writeBatch(firestore);

            const newSnippet: CommunitySnippet = {
                communityId: communityData.id,
                imageURL: communityData.imageURL || "",
                isModerator: user?.uid === communityData.creatorId,
            };
            batch.set(doc(firestore, `users/${user?.uid}/communitySnippets`, communityData.id), newSnippet);

            batch.update(doc(firestore, 'communities', communityData.id), {
                numberOfMembers: increment(1),
            });

            await batch.commit();

           setCommunityStateValue(prev => ({
                ...prev,
                mySnippets: [...prev.mySnippets, newSnippet]
           }))

        }catch(error: any){
            console.log("joinCommunity error", error);
            setError(error.message);
        }
        setLoading(false);
    };
    
    const leaveCommunity = async (communityId: string) => {

        try{
            const batch = writeBatch(firestore);

            batch.delete(doc(firestore, `users/${user?.uid}/communitySnippets`, communityId))

            batch.update(doc(firestore, 'communities', communityId), {
                numberOfMembers: increment(-1),
            });

            await batch.commit();


            setCommunityStateValue(prev => ({
                ...prev,
                mySnippets: prev.mySnippets.filter(item => item.communityId !== communityId)
            }))

        }catch (error: any){
            console.log('leaveCommunity', error.message);
            setError(error.message);
        }
        setLoading(false);
    };

    const getCommunityData = async (communityId: string) => {

        try{
            const communityDocRef = doc(firestore, "communities", communityId);
            const communityDoc = await getDoc(communityDocRef);

            setCommunityStateValue(prev => ({
                ...prev,
                currentCommunity:{
                    id: communityDoc.id,
                    ...communityDoc.data(),
                }as Community,
            }));
        }catch (error){
            console.log('getCommunityData', error);
        }

    };

    useEffect(() => {
        if(!user) {
            setCommunityStateValue(prev => ({
                ...prev,
                mySnippets: [],
                snippetsFetched: false,
            }))
            return;
        };
        getMySnippets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    useEffect(() => {
        const {communityId} = router.query;

        if(communityId && !communityStateValue.currentCommunity){
            getCommunityData(communityId as string);
        }
    },[router.query, communityStateValue.currentCommunity]);

    
    return {
        //data and functions 
        communityStateValue,
        onJoinOrLeaveCommunity,
        loading,
    }
}
export default useCommunityData;
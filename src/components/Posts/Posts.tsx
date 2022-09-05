import { Stack } from '@chakra-ui/react';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Community } from '../../atoms/communitiesAtom';
import { Post } from '../../atoms/postAtom';
import { auth, firestore } from '../../firebase/clientApp';
import usePosts from '../../hooks/usePosts';
import PostItem from './PostItem';
import PostLoader from './PostLoader';


type PostsProps = {
    communityData: Community;
    userId?: string;
};

const Posts:React.FC<PostsProps> = ({communityData}) => {
    
    // useAuthState

    const [loading,setLoading]= useState(false);
    const [user] = useAuthState(auth);
    const {postStateValue, setPostStateValue, onVote, onDeletePost, onSelectPost } = usePosts();

    const getPosts = async () => {
        try{
            setLoading(true);
            const postsQuery = query(
                collection(firestore, 'posts'),
                where('communityId', '==', communityData.id),
                orderBy("createdAt", "desc")
                );
                const postDocs = await getDocs(postsQuery);
                const posts = postDocs.docs.map(doc=> ({ id: doc.id, ...doc.data() }));
                setPostStateValue(prev => ({
                    ...prev,
                    posts: posts as [],
                }));

                console.log("posts", posts);
        }catch (error: any){
            console.log('getPosts error', error.message)
        }
        setLoading(false);
    };

    useEffect(() => {
        getPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[communityData])




    return (
        <>
        {loading ? (
            <PostLoader />
        ): (
          <Stack>
        {postStateValue.posts.map((item) => (
            // eslint-disable-next-line react/jsx-key
            <PostItem 
            key={item.id}
            post={item} 
            userIsCreator={user?.uid === item.creatorId} 
            userVoteValue={postStateValue.postVotes.find((vote) => vote.postId === item.id)?.voteValue} 
            onVote={onVote}
            onSelectPost={onSelectPost}
            onDeletePost={onDeletePost}
            />
        ))}
        </Stack>  
        )}
        
        </>
    )
}
export default Posts;